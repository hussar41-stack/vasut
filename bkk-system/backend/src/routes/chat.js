const express = require('express');
const router = express.Router();
const db = require('../db');

// Ensure table exists
db.query(`
  CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    sender TEXT,
    text TEXT,
    channel TEXT,
    type TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error('Error creating messages table:', err));

// GET /api/chat/messages?channel=bus
router.get('/messages', async (req, res) => {
  const { channel } = req.query;
  try {
    const result = await db.query(
      'SELECT * FROM messages WHERE channel = $1 ORDER BY created_at ASC LIMIT 100',
      [channel || 'global']
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Chat fetch error:', err);
    res.status(500).json({ error: 'Hiba az üzenetek betöltésekor' });
  }
});

// POST /api/chat/messages
router.post('/messages', async (req, res) => {
  const { sender, text, channel, type } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO messages (sender, text, channel, type) VALUES ($1, $2, $3, $4) RETURNING *',
      [sender, text, channel || 'global', type || 'incoming']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Chat save error:', err);
    res.status(500).json({ error: 'Hiba az üzenet mentésekor' });
  }
});

module.exports = router;
