/**
 * TransportHU – Backend API  (port 5000)
 * Teljesen önálló, azonnal futtatható.
 * node server.js  (a backend/ mappából)
 */

const express = require('express');
const cors    = require('cors');
const { v4: uuidv4 } = require('uuid');

const app  = express();
const PORT = 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
// Allow all origins in production (Render ← Vercel), keep credentials for local dev
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ─── In-Memory Store ──────────────────────────────────────────────────────────
const tickets      = [];           // purchased tickets
const delayStore   = {};           // { [tripId]: delayMinutes }

// ─── Station resolver ─────────────────────────────────────────────────────────
const STATIONS = {
  'budapest keleti':  'Budapest Keleti',
  'budapest nyugati': 'Budapest Nyugati',
  'budapest déli':    'Budapest Déli',
  'keleti':           'Budapest Keleti',
  'nyugati':          'Budapest Nyugati',
  'déli':             'Budapest Déli',
  'győr':             'Győr',   'gyor':            'Győr',
  'pécs':             'Pécs',   'pecs':            'Pécs',
  'debrecen':         'Debrecen',
  'miskolc':          'Miskolc',
  'szolnok':          'Szolnok',
  'székesfehérvár':   'Székesfehérvár',
  'eger':             'Eger',
  'sopron':           'Sopron',
  'nyíregyháza':      'Nyíregyháza',
  'kecskemét':        'Kecskemét',
  'szeged':           'Szeged',
  'veszprém':         'Veszprém',
  'szombathely':      'Szombathely',
  'kaposvár':         'Kaposvár',
  'zalaegerszeg':     'Zalaegerszeg',
  'tatabánya':        'Tatabánya',
};

function resolveStation(input) {
  if (!input) return 'Budapest Keleti';
  const key = input.toLowerCase().trim();
  if (STATIONS[key]) return STATIONS[key];
  const match = Object.entries(STATIONS).find(
    ([k]) => k.includes(key) || key.includes(k)
  );
  if (match) return match[1];
  return input.charAt(0).toUpperCase() + input.slice(1);
}

// ─── Train catalogue ──────────────────────────────────────────────────────────
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

const DEPARTURE_HOURS = [
  '05:15', '06:00', '07:30', '08:00', '09:00', '10:30',
  '11:15', '12:00', '13:15', '14:30', '15:45', '17:00',
  '18:30', '19:45', '21:00',
];

// ─── Deterministic seeded RNG ─────────────────────────────────────────────────
function seededRand(seed) {
  let s = Math.abs(seed) || 12345;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}
function strSeed(str) {
  return str.split('').reduce((a, c, i) => a + c.charCodeAt(0) * (i + 1), 0);
}

// ─── Schedule generator ───────────────────────────────────────────────────────
function generateSchedule(from, to, date) {
  const fromName   = resolveStation(from);
  const toName     = resolveStation(to);
  const targetDate = date || new Date().toISOString().split('T')[0];

  const seed  = strSeed(fromName + toName + targetDate);
  const rand  = seededRand(seed);
  const count = Math.floor(rand() * 5) + 5;   // 5–9 járat

  const times  = [...DEPARTURE_HOURS].sort(() => rand() - 0.5).slice(0, count).sort();
  const trains = [...TRAINS].sort(() => rand() - 0.5);

  return times.map((time, i) => {
    const train  = trains[i % trains.length];
    const depDate = new Date(`${targetDate}T${time}:00`);
    const delay  = rand() < 0.22 ? Math.floor(rand() * 28) + 2 : 0;
    const arrDate = new Date(depDate.getTime() + train.durationMin * 60000);

    return {
      id:             uuidv4(),
      routeName:      train.name,
      type:           train.type,
      fromName,
      toName,
      departureTime:  depDate.toISOString(),
      arrivalTime:    arrDate.toISOString(),
      delay,
      delayMinutes:   delay,
      status:         delay > 0 ? 'DELAYED' : 'ON_TIME',
      price:          train.basePrice,
      basePrice:      train.basePrice,
      availableSeats: Math.floor(rand() * 150) + 10,
      platform:       Math.floor(rand() * 10) + 1,
    };
  });
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), port: PORT });
});

// POST /api/search  – keresés
app.post('/api/search', (req, res) => {
  try {
    const { from, to, date } = req.body;
    if (!from && !to) {
      return res.status(400).json({ error: '"from" és "to" paraméter szükséges' });
    }

    const results = generateSchedule(from, to, date);
    console.log(`  → ${results.length} találat: ${resolveStation(from)} → ${resolveStation(to)}`);

    res.json({
      source:  'local',
      count:   results.length,
      fromName: resolveStation(from),
      toName:   resolveStation(to),
      date:    date || new Date().toISOString().split('T')[0],
      results,
    });
  } catch (err) {
    console.error('[search] Hiba:', err);
    res.status(500).json({ error: 'Belső szerverhiba', details: err.message });
  }
});

// PATCH /api/trips/:id/delay  – késés frissítése
app.patch('/api/trips/:id/delay', (req, res) => {
  try {
    const { id } = req.params;
    const delay  = parseInt(req.body.delayMinutes, 10);

    if (isNaN(delay) || delay < 0) {
      return res.status(400).json({ error: 'Érvénytelen delayMinutes érték' });
    }

    delayStore[id] = delay;
    console.log(`  → Késés frissítve: trip ${id} → ${delay} perc`);

    res.json({
      id,
      delayMinutes: delay,
      status: delay > 0 ? 'DELAYED' : 'ON_TIME',
    });
  } catch (err) {
    console.error('[delay] Hiba:', err);
    res.status(500).json({ error: 'Belső szerverhiba', details: err.message });
  }
});

// GET /api/tickets  – jegyek lekérése (email alapján)
app.get('/api/tickets', (req, res) => {
  try {
    const { email } = req.query;
    const result = email
      ? tickets.filter(t => t.passengerEmail === email)
      : tickets;
    res.json(result);
  } catch (err) {
    console.error('[tickets GET] Hiba:', err);
    res.status(500).json({ error: 'Belső szerverhiba', details: err.message });
  }
});

// POST /api/tickets  – jegyvásárlás
app.post('/api/tickets', (req, res) => {
  try {
    const {
      tripId, tripData,
      passengerName, passengerEmail,
      seatClass, quantity,
    } = req.body;

    if (!passengerName || !passengerEmail) {
      return res.status(400).json({ error: 'passengerName és passengerEmail kötelező' });
    }

    const qty = parseInt(quantity, 10) || 1;
    if (qty < 1 || qty > 10) {
      return res.status(400).json({ error: 'quantity 1–10 között kell legyen' });
    }

    const priceMultiplier = seatClass === 'FIRST' ? 1.5 : 1;
    const basePrice       = tripData?.basePrice ?? tripData?.price ?? 2990;
    const totalPrice      = Math.round(basePrice * priceMultiplier * qty);

    const ticket = {
      id:               uuidv4(),
      tripId:           tripId || uuidv4(),
      tripName:         tripData?.routeName || 'Vonat',
      from:             tripData?.fromName  || '–',
      to:               tripData?.toName    || '–',
      departureTime:    tripData?.departureTime || new Date().toISOString(),
      arrivalTime:      tripData?.arrivalTime   || new Date().toISOString(),
      passengerName,
      passengerEmail,
      seatClass:        seatClass || 'SECOND',
      quantity:         qty,
      totalPrice,
      purchasedAt:      new Date().toISOString(),
      status:           'CONFIRMED',
      confirmationCode: `HU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    };

    tickets.push(ticket);
    console.log(`  → Jegy létrehozva: ${ticket.confirmationCode} (${passengerEmail})`);

    res.status(201).json(ticket);
  } catch (err) {
    console.error('[tickets POST] Hiba:', err);
    res.status(500).json({ error: 'Belső szerverhiba', details: err.message });
  }
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚆  TransportHU API → http://localhost:${PORT}/api/health`);
  console.log(`    GET  /api/health`);
  console.log(`    POST /api/search`);
  console.log(`    GET  /api/tickets?email=`);
  console.log(`    POST /api/tickets`);
  console.log(`    PATCH /api/trips/:id/delay\n`);
});
