require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.ADMIN_PORT || 5001;
const JWT_SECRET = process.env.JWT_ADMIN_SECRET || 'gvk-top-secret-2025';

// Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json());

// WebSocket Clients
const clients = new Set();
wss.on('connection', (ws) => {
  clients.add(ws);
  ws.on('close', () => clients.delete(ws));
  console.log('Admin connected via WebSocket');
});

// Broadcast function
const broadcast = (data) => {
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

// Middlewares
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Nincs token' });
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Érvénytelen token' });
    req.admin = decoded;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.admin.role !== 'admin') return res.status(403).json({ error: 'Csak adminoknak' });
  next();
};

// Routes
app.get('/api/health', (req, res) => res.json({ status: 'Admin GVK OK' }));

// Mock Forda Database (Beosztások)
const fordaDB = {
  'peterszabo@transporthu.hu': { 
    id: 'F-102', 
    trips: [
        { id: 'IC560', from: 'Budapest-Keleti', to: 'Miskolc', dep: '08:25', track: '6' },
        { id: 'IC567', from: 'Miskolc', to: 'Budapest-Keleti', dep: '12:30', track: '2' }
    ],
    notes: 'Vigyázz a 2. kocsi klímájára!'
  },
  'zsoltkarasz@transporthu.hu': {
    id: 'F-SH-11',
    trips: [
        { id: 'G43', from: 'Székesfehérvár', to: 'Kőbánya-Kispest', dep: '09:10', track: '3' },
        { id: 'G43', from: 'Kőbánya-Kispest', to: 'Székesfehérvár', dep: '11:20', track: '1' }
    ],
    notes: 'Várpalota környékén sínfelújítás.'
  },
  'sandorkantor@transporthu.hu': {
    id: 'F-DUV-05',
    trips: [
        { id: 'S42', from: 'Dunaújváros', to: 'Budapest-Déli', dep: '08:45', track: '2' }
    ],
    notes: 'Gépmenet Budapest-Kelenföldről.'
  },
  'imrehorvath@transporthu.hu': {
    id: 'F-NKA-09',
    trips: [
        { id: 'IC201', from: 'Nagykanizsa', to: 'Budapest-Déli', dep: '10:15', track: '4' }
    ],
    notes: 'Kocsivizsgálat szükséges indulás előtt.'
  }
};

let activePersonnel = new Set(); // Aktív szolgálatban lévők

// Auth Route
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Hardcoded Demo Users (Always work even if DB is failing)
  const demoUsers = [
    { email: 'simonstella@transporthu.hu', pass: 'stella', name: 'Simon Stella', role: 'ENGINEER' },
    { email: 'kovacsbalazs@transporthu.hu', pass: 'balázs', name: 'Kovács Balázs', role: 'CONDUCTOR' },
    { email: 'totheszter@transporthu.hu', pass: 'eszter', name: 'Tóth Eszter', role: 'ENGINEER' },
    { email: 'molnaradam@transporthu.hu', pass: 'ádám', name: 'Molnár Ádám', role: 'CONDUCTOR' },
    { email: 'mav.admin@gvk.hu', pass: 'admin', name: 'MÁV Adminisztrátor', role: 'admin' },
    { email: 'bkk.admin@gvk.hu', pass: 'admin', name: 'BKK Adminisztrátor', role: 'admin' }
  ];

  const userFound = demoUsers.find(u => u.email === email && u.pass === password);
  if (userFound) {
    const token = jwt.sign({ id: userFound.email, role: userFound.role, name: userFound.name }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ 
        token, 
        admin: { name: userFound.name, role: userFound.role, email: userFound.email, forda: fordaDB[email] || null } 
    });
  }

  // Database check as secondary
  try {
    const table = email.includes('admin') ? 'admins' : 'staff';
    const result = await pool.query(`SELECT * FROM ${table} WHERE email = $1`, [email]);
    const user = result.rows[0];
    
    if (user && user.password_hash === password) {
        const token = jwt.sign({ id: user.email, role: user.role, name: user.name, id_db: user.id }, JWT_SECRET, { expiresIn: '8h' });
        return res.json({ 
            token, 
            admin: { name: user.name, role: user.role, email: user.email, avatar_url: user.avatar_url, forda: fordaDB[email] || null } 
        });
    }
  } catch (err) {
    console.error('DB Login Error:', err.message);
  }

  res.status(401).json({ error: 'Hibás belépés vagy jelszó.' });
});

// --- PROFILE MANAGEMENT ---

// Update profile info
app.post('/api/auth/update-profile', authenticate, async (req, res) => {
  const { name, avatar_url } = req.body;
  const email = req.admin.id;
  const table = email.includes('admin') ? 'admins' : 'staff';
  
  try {
    const result = await pool.query(
      `UPDATE ${table} SET name = COALESCE($1, name), avatar_url = COALESCE($2, avatar_url) WHERE email = $3 RETURNING *`,
      [name, avatar_url, email]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change password
app.post('/api/auth/change-password', authenticate, async (req, res) => {
  const { old_password, new_password } = req.body;
  const email = req.admin.id;
  const table = email.includes('admin') ? 'admins' : 'staff';

  try {
    // Verify old password
    const userRes = await pool.query(`SELECT password_hash FROM ${table} WHERE email = $1`, [email]);
    if (!userRes.rows[0] || userRes.rows[0].password_hash !== old_password) {
      return res.status(400).json({ error: 'A régi jelszó nem egyezik!' });
    }

    await pool.query(`UPDATE ${table} SET password_hash = $1 WHERE email = $2`, [new_password, email]);
    res.json({ success: true, message: 'Jelszó sikeresen módosítva!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- TRIP MANAGEMENT (CRUD) ---

// Get all trips
app.get('/api/trips', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM trips ORDER BY departure_time ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new trip
app.post('/api/trips', authenticate, isAdmin, async (req, res) => {
  const { route_name, from_station, to_station, departure_time, status } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO trips (route_name, from_station, to_station, departure_time, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [route_name, from_station, to_station, departure_time, status || 'ACTIVE']
    );
    const newTrip = result.rows[0];
    broadcast({ type: 'TRIP_CREATED', data: newTrip });
    res.status(201).json(newTrip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update trip details
app.patch('/api/trips/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  
  // Dinamikus SQL építés a módosítandó mezők alapján
  const keys = Object.keys(fields);
  const values = Object.values(fields);
  const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
  
  try {
    const result = await pool.query(
      `UPDATE trips SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`,
      [...values, id]
    );
    
    if (result.rows.length === 0) return res.status(404).json({ error: 'Járat nem található' });
    
    const updatedTrip = result.rows[0];
    broadcast({ type: 'TRIP_UPDATE', data: updatedTrip });
    res.json(updatedTrip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete trip
app.delete('/api/trips/:id', authenticate, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM trips WHERE id = $1', [id]);
    broadcast({ type: 'TRIP_DELETED', data: { id } });
    res.json({ message: 'Járat törölve' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get relevant schedule for the logged-in driver (based on home station)
app.get('/api/driver/schedule', authenticate, async (req, res) => {
  const email = req.admin.id; // From JWT
  
  try {
    // 1. Get driver's home station (location)
    const staffRes = await pool.query('SELECT location FROM staff WHERE email = $1', [email]);
    if (staffRes.rows.length === 0) return res.status(404).json({ error: 'Munkavállaló nem található' });
    
    const driverLocation = staffRes.rows[0].location;
    if (!driverLocation) return res.json([]); // No home station assigned yet

    // 2. Fetch trains that start OR end at this location
    const today = new Date().toISOString().split('T')[0];

    const tripsRes = await pool.query(`
      SELECT * FROM trips 
      WHERE (departure_station = $1 OR arrival_station = $1)
      AND departure_time::date = $2::date
      ORDER BY departure_time ASC
    `, [driverLocation, today]);

    res.json(tripsRes.rows);
  } catch (err) {
    console.error('Driver Schedule Error:', err.message);
    res.status(500).json({ error: 'Hiba a menetrend lekérésekor' });
  }
});

// Admin endpoint to get suggestions for ANY staff member
app.get('/api/admin/staff-suggestions/:email', authenticate, isAdmin, async (req, res) => {
  const { email } = req.params;
  try {
    const staffRes = await pool.query('SELECT location FROM staff WHERE email = $1', [email]);
    if (staffRes.rows.length === 0) return res.status(404).json({ error: 'Mayer nem található' });
    
    const loc = staffRes.rows[0].location;
    if (!loc) return res.json([]);

    const today = new Date().toISOString().split('T')[0];
    const tripsRes = await pool.query(`
      SELECT id, train_number, departure_station, arrival_station, departure_time 
      FROM trips 
      WHERE (departure_station = $1 OR arrival_station = $1)
      AND departure_time::date = $2::date
      ORDER BY departure_time ASC
    `, [loc, today]);

    res.json(tripsRes.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- STAFF MANAGEMENT ---

// Get all staff
app.get('/api/staff', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM staff ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Assign staff to trip
app.post('/api/trips/:id/assign', authenticate, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { staff_ids } = req.body; // Array of staff IDs
  
  try {
    // Itt egy egyszerű join táblás vagy JSON-be mentős megoldás
    const result = await pool.query(
      'UPDATE trips SET crew_info = $1 WHERE id = $2 RETURNING *',
      [JSON.stringify(staff_ids), id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- EMERGENCY ALERTS ---

let currentAlert = null;

// Get active alert
app.get('/api/alerts', (req, res) => {
  res.json(currentAlert);
});

// Post new alert
app.post('/api/alerts', authenticate, isAdmin, (req, res) => {
  const { message, level } = req.body; // level: 'info', 'warning', 'danger'
  currentAlert = { message, level, timestamp: new Date() };
  broadcast({ type: 'GLOBAL_ALERT', data: currentAlert });
  res.json(currentAlert);
});

// Clear alert
app.delete('/api/alerts', authenticate, isAdmin, (req, res) => {
  currentAlert = null;
  broadcast({ type: 'CLEAR_ALERT' });
  res.json({ message: 'Riasztás törölve' });
});

// --- PERSONNEL OPERATIONS (SIGN ON/OFF) ---

// Sign On for Duty
app.post('/api/ops/sign-on', authenticate, async (req, res) => {
  const email = req.admin.id;
  try {
    await pool.query(
      'INSERT INTO staff_presence (staff_email, status, sign_on_time) VALUES ($1, $2, CURRENT_TIMESTAMP)',
      [email, 'ACTIVE']
    );
    activePersonnel.add(email);
    broadcast({ type: 'STAFF_SIGN_ON', data: { email, time: new Date() } });
    res.json({ message: 'Szolgálat megkezdve' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sign Off from Duty
app.post('/api/ops/sign-off', authenticate, async (req, res) => {
  const email = req.admin.id;
  try {
    await pool.query(
      'UPDATE staff_presence SET status = $1, sign_off_time = CURRENT_TIMESTAMP WHERE staff_email = $2 AND status = $3',
      ['CLOSED', email, 'ACTIVE']
    );
    activePersonnel.delete(email);
    broadcast({ type: 'STAFF_SIGN_OFF', data: { email, time: new Date() } });
    res.json({ message: 'Szolgálat befejezve' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- TECH & DEFECT REPORTS ---

let techReports = [];
let defectTickets = [];

// Post tech report (Engineer)
app.post('/api/tech-reports', authenticate, async (req, res) => {
  const { type, details, trip_id } = req.body;
  const report = { id: Date.now(), type, details, trip_id, reporter: req.admin.name, timestamp: new Date() };
  techReports.push(report);
  broadcast({ type: 'NEW_TECH_REPORT', data: report });
  res.status(201).json(report);
});

// Post defect ticket (Conductor)
app.post('/api/defects', authenticate, async (req, res) => {
  const { car_number, issue, trip_id } = req.body;
  const ticket = { id: Date.now(), car_number, issue, trip_id, reporter: req.admin.name, timestamp: new Date() };
  defectTickets.push(ticket);
  broadcast({ type: 'NEW_DEFECT_TICKET', data: ticket });
  res.status(201).json(ticket);
});

// --- STAFF MONTHLY SCHEDULES (Vezénylés) ---

// Get schedules for a month
app.get('/api/staff-schedules', authenticate, async (req, res) => {
  const { month, year, email } = req.query; // format month: 0-11
  try {
    let query = 'SELECT * FROM staff_schedules WHERE 1=1';
    const params = [];
    
    if (month && year) {
        const start = `${year}-${Number(month)+1}-01`;
        const end = `${year}-${Number(month)+1}-31`; // Approx, PG handles it
        query += ` AND duty_date >= $${params.length+1} AND duty_date <= $${params.length+2}`;
        params.push(start, end);
    }
    
    if (email) {
        query += ` AND staff_email = $${params.length+1}`;
        params.push(email);
    }
    
    const result = await pool.query(query + ' ORDER BY duty_date ASC', params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save/Update schedule for a day
app.post('/api/staff-schedules', authenticate, isAdmin, async (req, res) => {
  const { staff_email, duty_date, shift_start, shift_end, trip_ids, notes, status } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO staff_schedules 
       (staff_email, duty_date, shift_start, shift_end, trip_ids, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (staff_email, duty_date) 
       DO UPDATE SET 
         shift_start = EXCLUDED.shift_start,
         shift_end = EXCLUDED.shift_end,
         trip_ids = EXCLUDED.trip_ids,
         notes = EXCLUDED.notes,
         status = EXCLUDED.status
       RETURNING *`,
      [staff_email, duty_date, shift_start, shift_end, trip_ids, notes, status || 'ASSIGNED']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ops/all-reports', authenticate, isAdmin, (req, res) => {
  res.json({ tech: techReports, defects: defectTickets });
});

// Initialize active personnel from DB
async function initActivePersonnel() {
  try {
    const res = await pool.query("SELECT staff_email FROM staff_presence WHERE status = 'ACTIVE'");
    res.rows.forEach(r => activePersonnel.add(r.staff_email));
    console.log(`✅ ${activePersonnel.size} personnel active at startup.`);
  } catch (err) {
    console.error('Personnel init error:', err.message);
  }
}
initActivePersonnel();

server.listen(PORT, () => {
    console.log(`🏢 GVK Admin Backend running on port ${PORT}`);
});
