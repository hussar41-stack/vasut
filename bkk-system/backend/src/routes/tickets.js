const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * GET /api/tickets - list all (filtered by userId)
 */
router.get('/', async (req, res) => {
  const { userId } = req.query;
  try {
    if (!userId) {
      const result = await db.query('SELECT * FROM tickets ORDER BY purchase_date DESC');
      return res.json(result.rows);
    }
    
    const result = await db.query(
      'SELECT * FROM tickets WHERE user_id = $1 ORDER BY purchase_date DESC',
      [userId]
    );
    
    const userTickets = result.rows;
    
    // If NO real tickets found in DB, return a demo "Welcome" ticket
    if (userTickets.length === 0) {
      return res.json([{
        id: 'welcome-demo',
        trip_id: 'demo',
        route_name: 'TransportHU Üdvözlő Jegy (v1.8.0)',
        from_station: 'Kezdőállomás',
        to_station: 'Célállomás',
        departure_time: new Date().toISOString(),
        price: 0,
        type: 'TICKET',
        user_id: userId,
        status: 'CONFIRMED',
        qr_code: 'WELCOME2024',
        purchase_date: new Date().toISOString()
      }]);
    }
    
    // Map DB columns to frontend expected camelCase names if necessary 
    // or just return as is if the frontend handles snake_case
    res.json(userTickets.map(t => ({
      ...t,
      // Mapping for compatibility
      tripName: t.route_name,
      from: t.from_station,
      to: t.to_station,
      totalPrice: t.price,
      purchasedAt: t.purchase_date,
      confirmationCode: t.qr_code
    })));
  } catch (err) {
    console.error('Fetch tickets error:', err);
    res.status(500).json({ error: 'Hiba a jegyek lekérésekor' });
  }
});

/**
 * GET /api/tickets/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM tickets WHERE id = $1', [req.params.id]);
    const ticket = result.rows[0];
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: 'Hiba a jegy lekérésekor' });
  }
});

module.exports = router;
