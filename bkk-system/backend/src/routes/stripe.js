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
    const finalType = type || 'TICKET';

    if (finalType === 'TICKET') {
      // Robust ticket price calculation
      const basePrice = tripData?.basePrice ?? 2990;
      let multiplier = 1;
      
      const discountType = req.body.discountType || 'full';
      if (discountType === 'discount50') multiplier = 0.5;
      else if (discountType === 'discount90') multiplier = 0.1;
      else if (discountType === 'free') multiplier = 0;
      
      const classMultiplier = (seatClass === 'FIRST' ? 1.5 : 1);
      unitAmount = Math.round(basePrice * multiplier * classMultiplier);
      
      lineItemName = 'Menetjegy';
      lineItemDesc = `${tripData?.fromName} ➔ ${tripData?.toName} (${tripData?.routeName || 'Vonat'})`;
    } else if (finalType === 'PASS') {
      // Official pricing rules for passes if not provided or to verify
      const officialPrices = {
        'budapest': { full: 8950, student: 945 },
        'country': { full: 18900, student: 1890 },
        'county': { full: 9450, student: 945 }
      };

      const basePass = officialPrices[passId];
      if (basePass) {
        unitAmount = passData?.isStudent ? basePass.student : basePass.full;
      } else {
        unitAmount = passData?.price || 9450;
      }

      lineItemName = passData?.name || 'Vármegyebérlet';
      lineItemDesc = `${passData?.description || 'Havi bérlet'} - Érvényes 30 napig`;
    }

    // Handle 0 HUF transactions - Stripe requires at least ~200 HUF for real sessions
    // For demo purposes, if amount is 0, we could potentially return a special flag 
    // but here we'll just let Stripe handle the error if it's too low, 
    // or use a minimum if it's a test.
    const finalAmount = Math.max(0, unitAmount);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      success_url: `${FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/cancel`,
      line_items: [
        {
          price_data: {
            currency: 'huf',
            product_data: {
              name: `TransportHU: ${lineItemName}`,
              description: lineItemDesc,
              images: [finalType === 'PASS' ? 'https://transport.hu/icons/pass.png' : 'https://transport.hu/icons/ticket.png'],
            },
            unit_amount: finalAmount * 100, // HUF is treated as 2-decimal in Stripe API
          },
          quantity: qty,
        },
      ],
      metadata: {
        type: finalType,
        userId: req.body.userId || '',
        passengerName,
        passengerEmail: passengerEmail || '',
        seatClass: seatClass || 'SECOND',
        quantity: qty.toString(),
        discountType: req.body.discountType || 'full',
        tripId: tripId || '',
        passId: passId || '',
        tripData: tripData ? JSON.stringify(tripData) : '',
        passData: passData ? JSON.stringify(passData) : '',
        finalUnitAmount: finalAmount.toString()
      },
    });

    res.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe Session Error:', err);
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

    const { type, userId, tripId, tripData, passId, passData } = session.metadata;
    
    const db = require('../db');

    if (type === 'TICKET') {
        const parsedTrip = tripData ? JSON.parse(tripData) : {};
        const confirmationCode = `HU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        
        const result = await db.query(
          `INSERT INTO tickets (
            user_id, trip_id, route_name, from_station, to_station, 
            departure_time, price, type, status, qr_code
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
          [
            userId, tripId, parsedTrip.routeName, parsedTrip.fromName, parsedTrip.toName,
            parsedTrip.departureTime, Math.round(session.amount_total / 100), 'TICKET', 'CONFIRMED', confirmationCode
          ]
        );
        
        return res.json({ success: true, ticket: result.rows[0] });
    }

    if (type === 'PASS') {
        const parsedPass = passData ? JSON.parse(passData) : {};
        const confirmationCode = `PASS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        const result = await db.query(
          `INSERT INTO tickets (
            user_id, route_name, price, type, pass_type, status, qr_code
          ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [
            userId, parsedPass.name || 'Bérlet', Math.round(session.amount_total / 100), 
            'PASS', passId, 'CONFIRMED', confirmationCode
          ]
        );
        
        return res.json({ success: true, pass: result.rows[0] });
    }

    res.json({ success: true, message: 'Payment confirmed but no logic for this type yet' });
  } catch (err) {
    console.error('Confirm Payment Error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
