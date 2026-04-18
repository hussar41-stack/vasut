require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const http = require('http');
const WebSocket = require('ws');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'transporthu-secret-2025';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_mock'); // Setup Stripe
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://vasut-seven.vercel.app';
const { sendEmail } = require('./emailService');

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());

// Basic rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Túl sok kérés, kérjük próbáld újra később.' }
});
app.use('/api/', limiter);

// Log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ─── Stripe Webhook (Must be before express.json) ──────────────────────────────
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // If you add a real webhook secret, use it. Otherwise, fallback for test purposes.
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (secret && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, secret);
    } else {
      event = JSON.parse(req.body); // Fallback for local testing without CLI
    }
  } catch (err) {
    console.error(`Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful payment
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Metadata contains our internal ticket info
    const { passengerEmail, passengerName, seatClass, tripData, qty, tripId } = session.metadata;

    const ticket = {
      id: uuidv4(),
      tripId: tripId || uuidv4(),
      tripName: tripData ? JSON.parse(tripData).routeName : 'Vonat',
      network: tripData ? (JSON.parse(tripData).network || 'mav') : 'mav',
      from: tripData ? JSON.parse(tripData).fromName : '–',
      to: tripData ? JSON.parse(tripData).toName : '–',
      departureTime: tripData ? JSON.parse(tripData).departureTime : new Date().toISOString(),
      arrivalTime: tripData ? JSON.parse(tripData).arrivalTime : new Date().toISOString(),
      passengerName,
      passengerEmail,
      seatClass: seatClass || 'SECOND',
      quantity: parseInt(qty, 10) || 1,
      totalPrice: session.amount_total / 100, // Convert from fillér/cents to HUF
      purchasedAt: new Date().toISOString(),
      status: 'CONFIRMED',
      confirmationCode: `HU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      stripeSessionId: session.id
    };
    tickets.push(ticket);
    console.log(`  → Jegy sikeresen kifizetve (Stripe Webhook): ${ticket.confirmationCode} (${passengerEmail})`);

    // PDF generálás
    const { generateTicketPDF, generateInvoicePDF } = require('./pdfService');
    const ticketPdfBuffer = await generateTicketPDF(ticket);
    const invoicePdfBuffer = await generateInvoicePDF(ticket);

    const attachments = [
      {
        filename: `TransportHU_Uti_Jegy_${ticket.confirmationCode}.pdf`,
        content: ticketPdfBuffer,
        contentType: 'application/pdf'
      },
      {
        filename: `TransportHU_Szamla_Bizonylat_${ticket.confirmationCode}.pdf`,
        content: invoicePdfBuffer,
        contentType: 'application/pdf'
      }
    ];

    // Send Ticket purchase email
    await sendEmail(passengerEmail, 'Sikeres jegyvásárlás - TransportHU PDF', `
      <h2>Kedves ${passengerName}!</h2>
      <p>Köszönjük, hogy jegyet vásároltál a TransportHU rendszerben!</p>
      <div style="padding:20px; border:1px solid #e5e7eb; background:#f9fafb; border-radius:8px; margin:20px 0;">
        <h3 style="margin-top:0; color:#111827;">MÁV / BKK E-Ticket (Csatolva!)</h3>
        <p style="font-family:monospace; font-size:1.4rem; font-weight:bold; color:#3b82f6; letter-spacing:2px; margin: 10px 0;">${ticket.confirmationCode}</p>
        <hr style="border:none; border-top:1px dashed #ccc; margin:15px 0;">
        <p><b>Utas neve:</b> ${passengerName}</p>
        <p><b>Útvonal:</b> ${ticket.from} ➔ ${ticket.to}</p>
        <p><b>Dátum / Indulás:</b> ${new Date(ticket.departureTime).toLocaleString('hu-HU')}</p>
        <p><b>Mennyiség:</b> ${ticket.quantity} db</p>
        <p><b>Végösszeg:</b> ${ticket.totalPrice} Ft</p>
        <p><b>Kocsiosztály:</b> ${ticket.seatClass === 'FIRST' ? '1. osztály' : '2. osztály'}</p>
      </div>
      <p>Kérjük, nyisd meg a csatolt <b>PDF nyomtatható jegyet</b> és mutasd be az ellenőrnek.</p>
      <p>Szintén csatoltuk számodra a hivatalos fizetési bizonylatot is.</p>
      <p>Jó utazást kívánunk!</p>
    `, attachments);
  }

  res.json({ received: true });
});

// For all other routes, use JSON parser
app.use(express.json());

// ─── Server setup with WebSocket ──────────────────────────────────────────────
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('🔗 WebSocket kliens csatlakozott');
  ws.send(JSON.stringify({ type: 'connected', message: 'Sikeres csatlakozás a valós idejű szerverhez' }));

  ws.on('close', () => console.log('❌ WebSocket kliens lecsatlakozott'));
});

// Broadcast function for real-time updates
function broadcastUpdate(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// ─── In-Memory Stores ─────────────────────────────────────────────────────────
const users = [];       // { id, name, email, passwordHash, createdAt }
const tickets = [];     // purchased tickets
const resetTokens = {}; // { token: { email, expiresAt } }
const delayStore = {};  // { tripId: delayMinutes }

// ─── Custom delay update to trigger WebSocket ─────────────────────────────────
app.patch('/api/trips/:id/delay', (req, res) => {
  try {
    const { id } = req.params;
    const delay = parseInt(req.body.delayMinutes, 10);

    if (isNaN(delay) || delay < 0) {
      return res.status(400).json({ error: 'Érvénytelen delayMinutes érték' });
    }

    delayStore[id] = delay;
    console.log(`  → Késés frissítve: trip ${id} → ${delay} perc`);

    const updateData = {
      id,
      delayMinutes: delay,
      status: delay > 0 ? 'DELAYED' : 'ON_TIME',
    };

    // Broadcast to all connected clients
    broadcastUpdate({ type: 'delay_update', data: updateData });

    res.json(updateData);
  } catch (err) {
    console.error('[delay] Hiba:', err);
    res.status(500).json({ error: 'Belső szerverhiba', details: err.message });
  }
});

// ─── JWT Middleware ────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Bejelentkezés szükséges' });
  }
  try {
    req.user = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Érvénytelen vagy lejárt token' });
  }
}

// ─── Auth Routes ──────────────────────────────────────────────────────────────

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Név, e-mail és jelszó kötelező' });
    if (password.length < 6)
      return res.status(400).json({ error: 'A jelszó legalább 6 karakter kell legyen' });
    if (users.find(u => u.email === email))
      return res.status(409).json({ error: 'Ez az e-mail cím már regisztrált' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = { id: uuidv4(), name, email, passwordHash, createdAt: new Date().toISOString() };
    users.push(user);

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    console.log(`  → Új felhasználó: ${email}`);

    const emailStatus = await sendEmail(email, 'Sikeres regisztráció - TransportHU', `
      <h2>Üdvözlünk a rendszerben, ${name}!</h2>
      <p>Köszönjük, hogy regisztráltál a TransportHU felületén.</p>
      <p>Innentől kezdve jegyvásárlásaidat kényelmesen nyomon követheted a fiókodban.</p>
    `);

    res.status(201).json({ user: { id: user.id, name, email }, token, emailStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'E-mail és jelszó kötelező' });

    const user = users.find(u => u.email === email);
    if (!user) return res.status(401).json({ error: 'Hibás e-mail vagy jelszó' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Hibás e-mail vagy jelszó' });

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    console.log(`  → Bejelentkezés: ${email}`);
    res.json({ user: { id: user.id, name: user.name, email }, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Felhasználó nem található' });
  res.json({ id: user.id, name: user.name, email: user.email, createdAt: user.createdAt });
});

// POST /api/auth/forgot-password
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'E-mail cím kötelező' });

    const user = users.find(u => u.email === email);
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min

    if (user) {
      resetTokens[token] = { email, expiresAt };
      
      const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;
      sendEmail(email, 'Jelszó visszaállítása - TransportHU', `
        <h2>Kedves ${user.name}!</h2>
        <p>Jelszó helyreállítási kérelem érkezett a TransportHU fiókodhoz.</p>
        <p>Új jelszó beállításához kattints a lenti linkre (a link 15 percig érvényes):</p>
        <a href="${resetLink}" style="padding:10px 20px; background:#3b82f6; color:#fff; text-decoration:none; border-radius:5px; display:inline-block; margin-top:10px;">Jelszó visszaállítása</a>
        <br><br>
        <p>Ha a gomb nem működik, másold be ezt a linket a böngésződbe: <br> ${resetLink}</p>
        <hr>
        <small>Ha nem te kérted a jelszavad visszaállítását, ezt az üzenetet hagyd figyelmen kívül.</small>
      `);
    }

    res.json({
      message: 'Ha regisztrált ez az e-mail cím, hamarosan megérkezik a visszaállító link.',
      ...(process.env.NODE_ENV !== 'production' && user ? { resetToken: token } : {}),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/reset-password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword)
      return res.status(400).json({ error: 'Token és új jelszó kötelező' });
    if (newPassword.length < 6)
      return res.status(400).json({ error: 'A jelszó legalább 6 karakter kell legyen' });

    const record = resetTokens[token];
    if (!record) return res.status(400).json({ error: 'Érvénytelen token' });
    if (new Date() > new Date(record.expiresAt))
      return res.status(400).json({ error: 'A token lejárt (15 perc)' });

    const user = users.find(u => u.email === record.email);
    if (!user) return res.status(404).json({ error: 'Felhasználó nem található' });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    delete resetTokens[token];
    console.log(`  → Jelszó visszaállítva: ${user.email}`);
    res.json({ message: 'Jelszó sikeresen megváltoztatva' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Health & News ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), port: PORT });
});

app.get('/api/site-info', (req, res) => {
  res.json({
    editor: {
      name: 'Huszár Barnabás',
      email: 'huszarbarnabas@example.hu',
      phone: '+36 30 123 4567',
      role: 'Felelős szerkesztő'
    },
    version: '1.2.0-demo',
    copyright: '© 2026 TransportHU',
    disclaimer: 'Nem hivatalos demo alkalmazás · JWT autentikáció · Leaflet térkép'
  });
});

const { getLatestNews } = require('./newsService');
app.get('/api/news', async (req, res) => {
  try {
    const news = await getLatestNews();
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const { getAIPredictedVehicles, getAIPredictedTrains } = require('./aiTrafficService');

// MÁV Live Trains - AI-Assisted Position Prediction
app.get('/api/mav-trains', async (req, res) => {
  try {
    const mavNews = await getLatestNews();
    const trains = await getAIPredictedTrains(mavNews);
    
    if (trains && trains.length > 0) {
      return res.json({ 
        count: trains.length, 
        trains: trains.map(t => ({ ...t, isAI: true })), 
        mode: 'ai_simulated', 
        timestamp: new Date().toISOString() 
      });
    }

    // Fallback ha nincs AI válasz
    const mockTrains = [
      { id:'t1', lat:47.5002, lng:19.0836, label:'Személy', type:'LOCAL', stopName:'Buda Keleti', color:'#86efac' },
      { id:'t2', lat:47.4636, lng:19.0118, label:'Személy', type:'LOCAL', stopName:'Kelenföld', color:'#86efac' }
    ];
    res.json({ count: mockTrains.length, trains: mockTrains, mode: 'mock' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
app.get('/api/bkk-vehicles', async (req, res) => {
  try {
    const bkkApiKey = process.env.BKK_API_KEY || 'apaiary-test';
    const url = `https://futar.bkk.hu/api/query/v1/ws/otp/routers/bkk/vehicles?key=${bkkApiKey}&appVersion=1.0&version=4`;
    
    // 1. Megpróbáljuk a VALÓDI BKK API-t
    const response = await fetch(url, {
      headers: { 'User-Agent': 'TransportHU/1.0', 'Accept': 'application/json' },
      timeout: 3000 // Ne várjon sokat ha rossz a kulcs
    });
    
    if (response.ok) {
      const json = await response.json();
      const { list, references } = json.data || {};
      
      if (list && list.length > 0) {
        const routesMap = references?.routes || {};
        const tripsMap = references?.trips || {};
        const stopsMap = references?.stops || {};

        const vehicles = list.map(v => {
          const trip = tripsMap[v.tripId] || {};
          const route = routesMap[trip.routeId] || routesMap[v.routeId] || {};
          const stop = stopsMap[v.stopId] || {};
          
          const bkkType = route.type;
          let type = 'bus';
          if (bkkType === 0) type = 'tram';
          else if (bkkType === 1) type = 'metro';
          else if (bkkType === 11) type = 'trolley';
          else if (bkkType === 109) type = 'suburban';

          return {
            id: v.vehicleId || v.id,
            lat: v.lat,
            lng: v.lon,
            label: route.shortName || v.label || v.vehicleId,
            routeId: trip.routeId || v.routeId,
            bearing: v.bearing || 0,
            color: route.color ? `#${route.color}` : null,
            textColor: route.textColor ? `#${route.textColor}` : '#ffffff',
            type: type,
            stopName: stop.name || 'Úton...',
            isAI: false
          };
        }).filter(v => v.lat && v.lng).slice(0, 300);
        
        return res.json({ count: vehicles.length, vehicles, mode: 'real', timestamp: new Date().toISOString() });
      }
    }
    
    // 2. HA A BKK API NEM AD ADATOT: Kapcsol az AI ÉLŐ SZIMULÁCIÓ (AI Bridge)! 🧠
    console.log('--- AI Bridge: Live Traffice Simulation indítása ---');
    const bkkNews = await getLatestNews(); // Beolvassuk a híreket vágányzárakhoz
    const aiVehicles = await getAIPredictedVehicles(bkkNews);
    
    if (aiVehicles && aiVehicles.length > 0) {
      return res.json({ 
        count: aiVehicles.length, 
        vehicles: aiVehicles.map(v => ({ ...v, isAI: true, type: v.type || 'bus' })), 
        mode: 'ai_simulated', 
        newsRef: bkkNews.length > 0,
        timestamp: new Date().toISOString() 
      });
    }

    // 3. VÉGSŐ FALLBACK: Statikus szimuláció
    const mock = generateMockBKKVehicles();
    res.json({ count: mock.length, vehicles: mock, mode: 'mock', timestamp: new Date().toISOString() });

  } catch (err) {
    console.warn('BKK Proxy hiba, AI szimuláció indult:', err.message);
    const mock = generateMockBKKVehicles();
    res.json({ count: mock.length, vehicles: mock, mode: 'mock', error: err.message });
  }
});

function generateMockBKKVehicles() {
  const routes = [
    { id: '7', label: '7 Buss', color: '#e74c3c' },
    { id: '4', label: '4-6 Villamos', color: '#f39c12' },
    { id: '6', label: '4-6 Villamos', color: '#f39c12' },
    { id: '2', label: '2 Villamos', color: '#e74c3c' },
    { id: 'M2', label: 'M2 Metró', color: '#e74c3c' },
    { id: 'M3', label: 'M3 Metró', color: '#3498db' },
    { id: '100E', label: '100E Airport', color: '#2ecc71' },
    { id: '15', label: '15 Busz', color: '#9b59b6' },
    { id: '56', label: '56 Villamos', color: '#1abc9c' },
    { id: 'M4', label: 'M4 Metró', color: '#27ae60' },
  ];
  
  // Budapest center area bounding box
  const center = { lat: 47.4979, lng: 19.0402 };
  const vehicles = [];
  
  routes.forEach((route, ri) => {
    const count = 3 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
      const angle = (ri * 36 + i * 25) * (Math.PI / 180);
      const radius = 0.02 + Math.random() * 0.04;
      vehicles.push({
        id: `${route.id}-${i}`,
        lat: center.lat + Math.cos(angle) * radius,
        lng: center.lng + Math.sin(angle) * radius * 1.5,
        label: route.label,
        routeId: route.id,
        bearing: Math.floor(Math.random() * 360),
        color: route.color,
        mock: true,
        type: route.id.startsWith('M') ? 'metro' : route.label.includes('Villamos') ? 'tram' : 'bus'
      });
    }
  });
  
  return vehicles;
}


// ─── Station resolver + Schedule generator ────────────────────────────────────
const STATIONS = {
  'budapest keleti': 'Budapest Keleti', 'budapest nyugati': 'Budapest Nyugati',
  'budapest déli': 'Budapest Déli', 'keleti': 'Budapest Keleti',
  'nyugati': 'Budapest Nyugati', 'déli': 'Budapest Déli',
  'győr': 'Győr', 'gyor': 'Győr', 'pécs': 'Pécs', 'pecs': 'Pécs',
  'debrecen': 'Debrecen', 'miskolc': 'Miskolc', 'szolnok': 'Szolnok',
  'székesfehérvár': 'Székesfehérvár', 'eger': 'Eger', 'sopron': 'Sopron',
  'nyíregyháza': 'Nyíregyháza', 'kecskemét': 'Kecskemét', 'szeged': 'Szeged',
  'veszprém': 'Veszprém', 'szombathely': 'Szombathely', 'kaposvár': 'Kaposvár',
  'zalaegerszeg': 'Zalaegerszeg', 'tatabánya': 'Tatabánya',
};
function resolveStation(input) {
  if (!input) return 'Budapest Keleti';
  const key = input.toLowerCase().trim();
  if (STATIONS[key]) return STATIONS[key];
  const match = Object.entries(STATIONS).find(([k]) => k.includes(key) || key.includes(k));
  return match ? match[1] : input.charAt(0).toUpperCase() + input.slice(1);
}

const TRAINS = [
  { name: 'IC 701 Intercity',  type: 'IC',      basePrice: 3490, durationMin: 90  },
  { name: 'IC 801 Intercity',  type: 'IC',      basePrice: 4190, durationMin: 85  },
  { name: 'IC 903 Intercity',  type: 'IC',      basePrice: 4990, durationMin: 120 },
  { name: 'IC 217 Intercity',  type: 'IC',      basePrice: 3790, durationMin: 95  },
  { name: 'EC 131 EuroCity',   type: 'EC',      basePrice: 5990, durationMin: 75  },
  { name: 'RJ 60 Railjet',     type: 'RAILJET', basePrice: 6990, durationMin: 70  },
  { name: 'S40 Sebesvonat',    type: 'FAST',    basePrice: 2990, durationMin: 110 },
  { name: 'G10 Gyorsvonat',    type: 'FAST',    basePrice: 1990, durationMin: 100 },
  { name: 'S50 Sebesvonat',    type: 'FAST',    basePrice: 3290, durationMin: 130 },
  { name: 'G22 Gyorsvonat',    type: 'FAST',    basePrice: 2490, durationMin: 115 },
  { name: 'Személyvonat 3041', type: 'LOCAL',   basePrice: 890,  durationMin: 155 },
  { name: 'Személyvonat 3043', type: 'LOCAL',   basePrice: 890,  durationMin: 160 },
];

const BKK_VEHICLES = [
  { name: 'M3 Metró', type: 'METRO', basePrice: 450, durationMin: 15 },
  { name: 'M4 Metró', type: 'METRO', basePrice: 450, durationMin: 10 },
  { name: 'M2 Metró', type: 'METRO', basePrice: 450, durationMin: 12 },
  { name: '4-6 Villamos', type: 'TRAM', basePrice: 450, durationMin: 22 },
  { name: '1-es Villamos', type: 'TRAM', basePrice: 450, durationMin: 30 },
  { name: '47-es Villamos', type: 'TRAM', basePrice: 450, durationMin: 25 },
  { name: '9-es Busz', type: 'BUS', basePrice: 450, durationMin: 35 },
  { name: '7E Busz', type: 'BUS', basePrice: 450, durationMin: 18 },
  { name: '5-ös Busz', type: 'BUS', basePrice: 450, durationMin: 40 },
  { name: '133E Busz', type: 'BUS', basePrice: 450, durationMin: 20 },
];

const HOURS = Array.from({length: 24}, (_, i) => `${i.toString().padStart(2, '0')}:15`)
              .concat(Array.from({length: 24}, (_, i) => `${i.toString().padStart(2, '0')}:45`));

function seededRand(s) {
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}
function strSeed(str) { return str.split('').reduce((a, c, i) => a + c.charCodeAt(0) * (i + 1), 0); }

function generateSchedule(from, to, date, sortBy = 'departure', network = 'mav') {
  const fromName = network === 'mav' ? resolveStation(from) : from;
  const toName = network === 'mav' ? resolveStation(to) : to;
  const targetDate = date || new Date().toISOString().split('T')[0];
  const rand  = seededRand(strSeed(fromName + toName + targetDate + network));
  const maxCount = network === 'bkk' ? 12 : 5;
  const count = Math.floor(rand() * maxCount) + maxCount;
  const times  = [...HOURS].sort(() => rand() - 0.5).slice(0, count).sort();
  
  const vehicles = network === 'bkk' ? [...BKK_VEHICLES].sort(() => rand() - 0.5) : [...TRAINS].sort(() => rand() - 0.5);

  let results = times.map((time, i) => {
    const train   = vehicles[i % vehicles.length];
    // Rögzítjük a magyar zónát (+02:00 / CEST)
    const depDate = new Date(`${targetDate}T${time}:00+02:00`);
    const delay   = delayStore[`${fromName}-${toName}-${time}`] ?? 
                     (rand() < (network === 'bkk' ? 0.1 : 0.22) ? Math.floor(rand() * (network === 'bkk' ? 10 : 28)) + 2 : 0);
    const arrDate = new Date(depDate.getTime() + train.durationMin * 60000);
    const totalTravelTimeMinutes = Math.round((arrDate - depDate) / 60000) + delay;
    
    return {
      id: `${fromName}-${toName}-${time}-${network}`,
      routeName: train.name, type: train.type, network,
      fromName, toName,
      departureTime: depDate.toISOString(), arrivalTime: arrDate.toISOString(),
      delay, delayMinutes: delay, status: delay > 0 ? 'DELAYED' : 'ON_TIME',
      price: train.basePrice, basePrice: train.basePrice,
      availableSeats: Math.floor(rand() * (network === 'bkk' ? 50 : 150)) + 10,
      platform: network === 'bkk' ? Math.floor(rand() * 4) + 1 : Math.floor(rand() * 10) + 1,
      totalTravelTimeMinutes,
      transfers: Math.floor(rand() * (network === 'bkk' ? 3 : 2))
    };
  });

  // Ha a mai napon keresünk, kidobjuk azokat a járatokat, amik már elmentek (a valós időben)
  const todayISO = new Date(new Date().getTime() + 2 * 3600 * 1000).toISOString().split('T')[0]; // Quick magyar (+2h) mai nap
  if (targetDate === todayISO || targetDate === new Date().toISOString().split('T')[0]) {
     const nowMs = new Date().getTime();
     results = results.filter(r => new Date(r.departureTime).getTime() > nowMs - 15 * 60000); // 15 perc türelmi idő a múltba
  }

  // Calculate AI Recommendations (Fastest, Direct)
  if (results.length > 0) {
      const fastest = [...results].sort((a,b) => a.totalTravelTimeMinutes - b.totalTravelTimeMinutes)[0];
      const direct = [...results].find(t => t.transfers === 0);
      
      results = results.map(r => ({
          ...r,
          isRecommendedFastest: r.id === fastest.id,
          isRecommendedDirect: direct && r.id === direct.id
      }));
  }

  // Sorting
  if (sortBy === 'duration') {
      results.sort((a, b) => a.totalTravelTimeMinutes - b.totalTravelTimeMinutes);
  } else if (sortBy === 'price') {
      results.sort((a, b) => a.price - b.price);
  } else {
      // Default: departure
      results.sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime));
  }

  return results;
}

// POST /api/search
app.post(['/api/search', '//api/search'], (req, res) => {
  try {
    const { from, to, date, sortBy, network = 'mav' } = req.body;
    if (!from && !to) return res.status(400).json({ error: '"from" és "to" paraméter szükséges' });
    const results = generateSchedule(from, to, date, sortBy, network);
    res.json({ source: 'local', count: results.length,
      fromName: network === 'mav' ? resolveStation(from) : from, 
      toName: network === 'mav' ? resolveStation(to) : to,
      date: date || new Date().toISOString().split('T')[0], results });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Fallback search route for aggressively cached mobile clients that still hit /search without /api
app.post(['/search', '//search'], (req, res) => {
  try {
    const { from, to, date, sortBy } = req.body;
    if (!from && !to) return res.status(400).json({ error: '"from" és "to" paraméter szükséges' });
    const results = generateSchedule(from, to, date, sortBy);
    res.json({ source: 'local', count: results.length,
      fromName: resolveStation(from), toName: resolveStation(to),
      date: date || new Date().toISOString().split('T')[0], results });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/ai-analyze', requireAuth, async (req, res) => {
  const { from, to, network, results } = req.body;
  if (!results || results.length === 0) {
    return res.json({ analysis: "Nincs elegendő adat az AI elemzéshez." });
  }

  // Ha nincs egyik API kulcs sem, adunk egy okos mock AI választ
  if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
    const fastest = results.find(r => r.isRecommendedFastest) || results[0];
    const netName = network === 'bkk' ? 'A BKK járatok' : 'A MÁV vonatok';
    return res.json({
      analysis: `💡 **AI Asszisztens:** A jelenlegi lekérdezés alapján a legoptimálisabb választás a(z) **${fastest.routeName}** a(z) ${from} ➡️ ${to} útvonalon, mivel a menetideje mindössze ${fastest.totalTravelTimeMinutes} perc. ${netName} esetében a menetrend jelenleg megbízható.`
    });
  }

  try {
    // Szűkítjük az adatokat, hogy ne menjünk át a token limiten
    const miniResults = results.slice(0, 4).map(r => 
      `${r.routeName} - Indul: ${new Date(r.departureTime).toLocaleTimeString('hu-HU', {hour:'2-digit', minute:'2-digit'})} (Késés: ${r.delayMinutes} perc, Út: ${r.totalTravelTimeMinutes} perc, Átszállás: ${r.transfers})`
    ).join('\n');

    const prompt = `Utazási szakértő AI vagy a TransportHU platformon. 
Elemezd röviden, barátságos, segítőkész hangvételben (1 maximum 2 rövid mondat) a következő útvonal opciókat: ${from} -> ${to} (${network.toUpperCase()} hálózat).
Ajánlj egyet az utazónak a menetidők vagy késések alapján (említsd meg konkrét járatot)!
Opciók:
${miniResults}`;

    let aiText = '';

    if (process.env.GROQ_API_KEY) {
      const { OpenAI } = require('openai');
      const groqClient = new OpenAI({ 
        apiKey: process.env.GROQ_API_KEY,
        baseURL: "https://api.groq.com/openai/v1"
      });
      const completion = await groqClient.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.5,
      });
      aiText = completion.choices[0].message.content;
    } else if (process.env.GEMINI_API_KEY) {
      const gUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const res = await fetch(gUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.5 }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
      aiText = data.candidates[0].content.parts[0].text;
    } else {
      const { OpenAI } = require('openai');
      const openaiCli = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openaiCli.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-3.5-turbo',
        temperature: 0.5,
      });
      aiText = completion.choices[0].message.content;
    }

    res.json({ analysis: `💡 **AI Asszisztens:** ${aiText.replace(/\*/g, '').trim()}` });
  } catch (err) {
    console.error('AI Elemzés Hiba:', err);
    res.json({ analysis: `Szerverhiba az AI generálás közben: ${err.message}. Szerezzen be egy INGYENES GROQ API kulcsot!` });
  }
});

// GET /api/tickets
app.get('/api/tickets', requireAuth, (req, res) => {
  try {
    // Only return tickets for the logged-in user
    const userTickets = tickets.filter(t => t.passengerEmail === req.user.email);
    res.json(userTickets);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/tickets (LEGACY / For testing fallback without Stripe)
app.post('/api/tickets', requireAuth, (req, res) => {
  try {
    const { tripId, tripData, passengerName, seatClass, quantity } = req.body;
    if (!passengerName)
      return res.status(400).json({ error: 'passengerName kötelező' });
      
    // Always use authenticated user's email
    const passengerEmail = req.user.email;

    const qty = Math.min(10, Math.max(1, parseInt(quantity, 10) || 1));
    const basePrice  = tripData?.basePrice ?? 2990;
    const totalPrice = Math.round(basePrice * (seatClass === 'FIRST' ? 1.5 : 1) * qty);
    const ticket = {
      id: uuidv4(), tripId: tripId || uuidv4(),
      tripName: tripData?.routeName || 'Vonat',
      from: tripData?.fromName || '–', to: tripData?.toName || '–',
      departureTime: tripData?.departureTime || new Date().toISOString(),
      arrivalTime:   tripData?.arrivalTime   || new Date().toISOString(),
      passengerName, passengerEmail,
      seatClass: seatClass || 'SECOND', quantity: qty, totalPrice,
      purchasedAt: new Date().toISOString(), status: 'CONFIRMED',
      confirmationCode: `HU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    };
    tickets.push(ticket);
    console.log(`  → Jegy: ${ticket.confirmationCode} (${passengerEmail})`);
    res.status(201).json(ticket);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/create-checkout-session
app.post('/api/create-checkout-session', requireAuth, async (req, res) => {
  try {
    const { tripId, tripData, passengerName, seatClass, quantity } = req.body;
    if (!passengerName) return res.status(400).json({ error: 'passengerName kötelező' });

    const qty = Math.min(10, Math.max(1, parseInt(quantity, 10) || 1));
    const basePrice = tripData?.basePrice ?? 2990;
    const unitPrice = Math.round(basePrice * (seatClass === 'FIRST' ? 1.5 : 1));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      success_url: `${FRONTEND_URL}/success`,
      cancel_url: `${FRONTEND_URL}/cancel`,
      customer_email: req.user.email,
      line_items: [
        {
          price_data: {
            currency: 'huf',
            product_data: {
              name: 'TransportHU Zrt. - Jegyvásárlás',
              description: `${tripData?.network === 'bkk' ? 'BKK Vonaljegy' : 'MÁV Jegy'}: ${tripData?.fromName || ''} → ${tripData?.toName || ''} | ${tripData?.routeName} | ${seatClass === 'FIRST' ? '1. osztály' : '2. osztály'}`,
            },
            unit_amount: unitPrice * 100, // Stripe expects lowest denomination (fillér/cents)
          },
          quantity: qty,
        },
      ],
      metadata: {
        passengerEmail: req.user.email,
        passengerName,
        seatClass,
        qty: qty.toString(),
        tripId: tripId || '',
        tripData: JSON.stringify(tripData), // Careful: limit is 500 chars, but this mock data is small enough
      },
    });

    res.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe Session Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 404 + error handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => res.status(500).json({ error: err.message }));

server.listen(PORT, () => {
  console.log(`\n🚆  TransportHU API → http://localhost:${PORT}/api/health`);
  console.log(`    Auth: POST /api/auth/register | /login | /forgot-password | /reset-password`);
  console.log(`    Data: POST /api/search | GET+POST /api/tickets`);
  console.log(`    WebSocket: ws://localhost:${PORT}\n`);
});
