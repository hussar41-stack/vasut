const express = require('express');
const router = express.Router();
const db = require('../db');

// Ensure table exists and has the vehicle_id column
db.query(`
  CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    sender TEXT,
    text TEXT,
    channel TEXT,
    vehicle_id TEXT,
    type TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).then(() => {
  // Safely add vehicle_id column if it doesn't exist yet (old schema migration)
  return db.query(`
    ALTER TABLE messages ADD COLUMN IF NOT EXISTS vehicle_id TEXT
  `);
}).catch(err => console.error('DB init error:', err));

/**
 * GET /api/chat/messages?channel=bus
 * Diszpécser: az egész csatornát látja
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
    console.error('Chat fetch error:', err);
    res.status(500).json({ error: 'Hiba az üzenetek betöltésekor' });
  }
});

/**
 * GET /api/chat/driver-messages?vehicle_id=BPI-007
 * Járművezető: CSAK a saját jármű üzeneteit látja
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
    console.error('Driver chat fetch error:', err);
    res.status(500).json({ error: 'Hiba az üzenetek betöltésekor' });
  }
});

/**
 * POST /api/chat/messages
 * Üzenet küldése (diszpécser vagy sofőr)
 */
router.post('/messages', async (req, res) => {
  const { sender, text, channel, vehicle_id, type } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO messages (sender, text, channel, vehicle_id, type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [sender, text, channel || 'global', vehicle_id || null, type || 'incoming']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Chat save error:', err);
    res.status(500).json({ error: 'Hiba az üzenet mentésekor' });
  }
});

module.exports = router;
