const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const store = require('../data/inMemoryStore');

// POST /api/tickets - purchase ticket
router.post('/', (req, res) => {
  const { tripId, passengerName, passengerEmail, seatClass, quantity } = req.body;

  if (!tripId || !passengerName || !passengerEmail) {
    return res.status(400).json({ error: 'tripId, passengerName, passengerEmail are required' });
  }

  const trip = store.trips.find(t => t.id === tripId);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  const qty = parseInt(quantity, 10) || 1;
  if (qty < 1 || qty > 10) return res.status(400).json({ error: 'Quantity must be 1–10' });

  const priceMultiplier = seatClass === 'FIRST' ? 1.5 : 1;
  const totalPrice = Math.round(trip.basePrice * priceMultiplier * qty);

  if (trip.availableSeats < qty) {
    return res.status(409).json({ error: 'Not enough available seats' });
  }

  const ticket = {
    id: uuidv4(),
    tripId,
    tripName: trip.routeName,
    from: trip.fromName,
    to: trip.toName,
    departureTime: trip.departureTime,
    arrivalTime: trip.arrivalTime,
    passengerName,
    passengerEmail,
    seatClass: seatClass || 'SECOND',
    quantity: qty,
    totalPrice,
    purchasedAt: new Date().toISOString(),
    status: 'CONFIRMED',
    confirmationCode: `HU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
  };

  // reduce seats
  const tripIdx = store.trips.findIndex(t => t.id === tripId);
  store.trips[tripIdx].availableSeats -= qty;

  store.tickets.push(ticket);
  res.status(201).json(ticket);
});

// GET /api/tickets - list all (admin view)
router.get('/', (req, res) => {
  const { email } = req.query;
  if (email) {
    const userTickets = store.tickets.filter(t => t.passengerEmail === email);
    
    // If NO tickets found, return a demo "Welcome" ticket
    if (userTickets.length === 0) {
      return res.json([{
        id: 'welcome-demo',
        tripId: 'demo',
        tripName: 'Üdvözöljük a TransportHU-n!',
        from: 'Kezdőpont',
        to: 'Célállomás',
        departureTime: new Date().toISOString(),
        arrivalTime: new Date(Date.now() + 3600000).toISOString(),
        passengerName: 'Új Felhasználó',
        passengerEmail: email,
        seatClass: 'SECOND',
        quantity: 1,
        totalPrice: 0,
        purchasedAt: new Date().toISOString(),
        status: 'CONFIRMED',
        confirmationCode: 'WELCOME',
      }]);
    }
    return res.json(userTickets);
  }
  res.json(store.tickets);
});

// GET /api/tickets/:id
router.get('/:id', (req, res) => {
  const ticket = store.tickets.find(t => t.id === req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  res.json(ticket);
});

module.exports = router;
