// Full Server Reset & Redeploy Trigger: 2026-04-17 03:51
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const stopsRouter      = require('./routes/stops');
const tripsRouter      = require('./routes/trips');
const ticketsRouter    = require('./routes/tickets');
const realSearchRouter = require('./routes/realSearch');
const newsRouter       = require('./routes/news');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true,
}));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/stops',       stopsRouter);
app.use('/api/trips',       tripsRouter);
app.use('/api/tickets',     ticketsRouter);
app.use('/api/real-search', realSearchRouter);
app.use('/api/news',        newsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.2.0-demo', timestamp: new Date().toISOString(), mode: 'in-memory' });
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

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚆 Transport API running → http://localhost:${PORT}/api/health`);
});

module.exports = app;
