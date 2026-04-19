const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_mock');
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * POST /api/stripe/create-checkout-session
 */
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { tripId, tripData, passengerName, seatClass, quantity } = req.body;
    const qty = Math.min(10, Math.max(1, parseInt(quantity, 10) || 1));
    const basePrice = tripData?.basePrice ?? 2990;
    const unitPrice = Math.round(basePrice * (seatClass === 'FIRST' ? 1.5 : 1));

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
              name: 'TransportHU Jegyvásárlás',
              description: `${tripData?.fromName} -> ${tripData?.toName} | ${tripData?.routeName}`,
            },
            unit_amount: unitPrice * 100,
          },
          quantity: qty,
        },
      ],
      metadata: {
        passengerName,
        seatClass,
        tripId,
        tripData: JSON.stringify(tripData),
      },
    });

    res.json({ id: session.id, url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
