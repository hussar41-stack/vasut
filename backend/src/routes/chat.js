const express = require('express');
const router = express.Router();
const db = require('../db');

// Ensure tables exist
db.query(`
  CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    sender TEXT,
    sender_id TEXT,
    recipient_id TEXT,
    text TEXT,
    channel TEXT,
    vehicle_id TEXT,
    type TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).then(() => {
  return db.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS vehicle_id TEXT`);
}).then(() => {
  return db.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_id TEXT`);
}).then(() => {
  return db.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS recipient_id TEXT`);
}).catch(err => console.error('DB init error:', err));

/**
 * GET /api/chat/contacts
 * Lista az összes regisztrált személyzetről (sofőrök, kalauzok)
 */
router.get('/contacts', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, email, role, location FROM users 
       WHERE role IS NOT NULL AND role != '' 
       ORDER BY name ASC`
    );
    
    // Ha nincs elég valódi user, demo adatokat adunk
    let contacts = result.rows;
    if (contacts.length < 2) {
      contacts = [
        { id: 'demo-1', name: 'Kovács Péter', role: 'BUSZSOFŐR', location: 'Kelenföldi Garázs', email: 'peter@bkk.hu' },
        { id: 'demo-2', name: 'Szabó Mária', role: 'VILLAMOSVEZETŐ', location: 'Baross Kocsiszín', email: 'maria@bkk.hu' },
        { id: 'demo-3', name: 'Nagy László', role: 'METRÓVEZETŐ', location: 'Kőér utca', email: 'laszlo@bkk.hu' },
        { id: 'demo-4', name: 'Tóth Anna', role: 'UTASKOORDINÁTOR', location: 'Deák tér', email: 'anna@bkk.hu' },
        { id: 'demo-5', name: 'Varga Béla', role: 'TROLIBUSZVEZETŐ', location: 'Pongrác Garázs', email: 'bela@bkk.hu' },
      ];
    }
    res.json(contacts);
  } catch (err) {
    console.error('Contacts fetch error:', err);
    res.status(500).json({ error: 'Hiba a névjegyzék betöltésekor' });
  }
});

/**
 * GET /api/chat/thread?partner_id=demo-1
 * Egy adott személy és a diszpécser közötti beszélgetés
 */
router.get('/thread', async (req, res) => {
  const { partner_id } = req.query;
  if (!partner_id) return res.status(400).json({ error: 'partner_id kötelező' });

  try {
    const result = await db.query(
      `SELECT * FROM messages 
       WHERE (sender_id = $1 OR recipient_id = $1)
       ORDER BY created_at ASC LIMIT 200`,
      [partner_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Thread fetch error:', err);
    res.status(500).json({ error: 'Hiba a beszélgetés betöltésekor' });
  }
});

/**
 * GET /api/chat/messages?channel=bus  (legacy support)
 */
router.get('/messages', async (req, res) => {
  const { channel } = req.query;
  try {
    const result = await db.query(
      'SELECT * FROM messages WHERE channel = $1 ORDER BY created_at ASC LIMIT 200',
      [channel || 'global']
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Hiba' });
  }
});

/**
 * GET /api/chat/driver-messages?vehicle_id=X  (legacy)
 */
router.get('/driver-messages', async (req, res) => {
  const { vehicle_id } = req.query;
  if (!vehicle_id) return res.status(400).json({ error: 'vehicle_id kötelező' });
  try {
    const result = await db.query(
      'SELECT * FROM messages WHERE vehicle_id = $1 ORDER BY created_at ASC LIMIT 100',
      [vehicle_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Hiba' });
  }
});

/**
 * POST /api/chat/messages
 */
router.post('/messages', async (req, res) => {
  const { sender, sender_id, recipient_id, text, channel, vehicle_id, type } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO messages (sender, sender_id, recipient_id, text, channel, vehicle_id, type) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [sender, sender_id || null, recipient_id || null, text, channel || 'direct', vehicle_id || null, type || 'incoming']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Chat save error:', err);
    res.status(500).json({ error: 'Hiba az üzenet mentésekor' });
  }
});

module.exports = router;
