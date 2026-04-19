const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_mock');
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * POST /api/stripe/create-checkout-session
 */
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { type, tripId, tripData, passId, passData, passengerName, seatClass, quantity } = req.body;
    
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

module.exports = router;
