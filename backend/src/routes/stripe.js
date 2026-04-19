const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_mock');
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * POST /api/stripe/create-checkout-session
 */
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { type, tripId, tripData, passId, passData, passengerName, passengerEmail, seatClass, quantity } = req.body;
    
    let lineItemName = 'TransportHU Vásárlás';
    let lineItemDesc = 'Általános szolgáltatás';
    let unitAmount = 0;
    const qty = Math.min(10, Math.max(1, parseInt(quantity, 10) || 1));

    if (type === 'TICKET') {
      const basePrice = tripData?.basePrice ?? 2990;
      unitAmount = Math.round(basePrice * (seatClass === 'FIRST' ? 1.5 : 1));
      lineItemName = 'Vonatjegy';
      lineItemDesc = `${tripData?.fromName} -> ${tripData?.toName} | ${tripData?.routeName}`;
    } else if (type === 'PASS') {
      unitAmount = passData?.price || 9450;
      lineItemName = passData?.name || 'Vármegyebérlet';
      lineItemDesc = passData?.description || 'Havi bérlet';
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      success_url: `${FRONTEND_URL}/success`,
      cancel_url: `${FRONTEND_URL}/cancel`,
      line_items: [
        {
          price_data: {
            currency: 'huf',
            product_data: {
              name: `TransportHU ${lineItemName}`,
              description: lineItemDesc,
            },
            unit_amount: unitAmount * 100,
          },
          quantity: qty,
        },
      ],
      metadata: {
        type,
        passengerName,
        passengerEmail: passengerEmail || '',
        seatClass: seatClass || 'SECOND',
        tripId: tripId || '',
        passId: passId || '',
        tripData: tripData ? JSON.stringify(tripData) : '',
        passData: passData ? JSON.stringify(passData) : '',
      },
    });

    res.json({ id: session.id, url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/confirm-payment
 * Simplified confirmation for demo/dev purposes
 */
router.post('/confirm-payment', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
        return res.status(400).json({ error: 'Payment not completed or session not found.' });
    }

    const { type, passengerName, passengerEmail, seatClass, quantity, tripId, tripData, passId } = session.metadata;
    
    const { v4: uuidv4 } = require('uuid');
    const store = require('../data/inMemoryStore');

    if (type === 'TICKET') {
        const parsedTrip = JSON.parse(tripData);
        const ticket = {
            id: uuidv4(),
            tripId,
            tripName: parsedTrip.routeName,
            from: parsedTrip.fromName,
            to: parsedTrip.toName,
            departureTime: parsedTrip.departureTime,
            arrivalTime: parsedTrip.arrivalTime,
            passengerName,
            passengerEmail,
            seatClass,
            quantity: parseInt(quantity, 10),
            totalPrice: session.amount_total / 100,
            purchasedAt: new Date().toISOString(),
            status: 'CONFIRMED',
            confirmationCode: `HU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        };
        store.tickets.push(ticket);
        return res.json({ success: true, ticket });
    }

    res.json({ success: true, message: 'Payment confirmed but no logic for this type yet' });
  } catch (err) {
    console.error('Confirm Payment Error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
