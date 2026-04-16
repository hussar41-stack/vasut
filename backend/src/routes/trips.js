const express = require('express');
const router = express.Router();
const store = require('../data/inMemoryStore');

// GET /api/trips - search trips
router.get('/', (req, res) => {
  const { from, to, date } = req.query;
  let results = store.trips;

  if (from) {
    results = results.filter(t => t.fromName?.toLowerCase().includes(from.toLowerCase()) || t.from === from);
  }
  if (to) {
    results = results.filter(t => t.toName?.toLowerCase().includes(to.toLowerCase()) || t.to === to);
  }
  if (date) {
    results = results.filter(t => t.departureTime.startsWith(date));
  }

  results = results.sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime));
  res.json(results.slice(0, 50));
});

// GET /api/trips/:id
router.get('/:id', (req, res) => {
  const trip = store.trips.find(t => t.id === req.params.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  res.json(trip);
});

// PATCH /api/trips/:id/delay - update delay
router.patch('/:id/delay', (req, res) => {
  const { delayMinutes } = req.body;
  const idx = store.trips.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Trip not found' });

  const delay = parseInt(delayMinutes, 10);
  if (isNaN(delay) || delay < 0) {
    return res.status(400).json({ error: 'Invalid delayMinutes value' });
  }

  store.trips[idx].delayMinutes = delay;
  store.trips[idx].status = delay > 0 ? 'DELAYED' : 'ON_TIME';
  res.json(store.trips[idx]);
});

module.exports = router;
