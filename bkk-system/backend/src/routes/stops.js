const express = require('express');
const router = express.Router();
const { stops } = require('../data/inMemoryStore');

// GET /api/stops - list all stops
router.get('/', (req, res) => {
  const { q } = req.query;
  if (q) {
    const filtered = stops.filter(s =>
      s.name.toLowerCase().includes(q.toLowerCase()) ||
      s.city.toLowerCase().includes(q.toLowerCase())
    );
    return res.json(filtered);
  }
  res.json(stops);
});

// GET /api/stops/:id
router.get('/:id', (req, res) => {
  const stop = stops.find(s => s.id === req.params.id);
  if (!stop) return res.status(404).json({ error: 'Stop not found' });
  res.json(stop);
});

module.exports = router;
