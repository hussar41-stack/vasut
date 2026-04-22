// Full Server Reset & Redeploy Trigger: 2024-04-19 13:54
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const stopsRouter      = require('./routes/stops');
const tripsRouter      = require('./routes/trips');
const ticketsRouter    = require('./routes/tickets');
const realSearchRouter = require('./routes/realSearch');
const newsRouter       = require('./routes/news');
const authRouter       = require('./routes/auth');
const liveRouter       = require('./routes/live');
const stripeRouter     = require('./routes/stripe');
const chatRouter       = require('./routes/chat');
const scheduleRouter   = require('./routes/staffSchedules');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
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
app.use('/api/search',      realSearchRouter); // Changed from /real-search to /search
app.use('/api/news',        newsRouter);
app.use('/api/auth',        authRouter);
app.use('/api/live',        liveRouter);
app.use('/api/chat',        chatRouter);
app.use('/api/staff-schedules', scheduleRouter);
app.use('/api',             stripeRouter); // Stripe handles /create-checkout-session at root of /api
app.use('/api',             realSearchRouter); // Also handle /ai-analyze if it's there

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.8.0', timestamp: new Date().toISOString(), mode: 'in-memory' });
});

app.get('/api/site-info', (req, res) => {
  res.json({
    editor: {
      name: 'Huszár Barnabás',
      email: 'hbgmunka@gmail.com',
      phone: '+36 70 327 0059',
      role: 'Felelős szerkesztő'
    },
    version: '1.8.0',
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
