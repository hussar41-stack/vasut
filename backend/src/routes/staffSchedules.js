const express = require('express');
const router = express.Router();
const db = require('../db');

// Ensure table exists
db.query(`
  CREATE TABLE IF NOT EXISTS staff_schedules (
    id SERIAL PRIMARY KEY,
    staff_email TEXT NOT NULL,
    duty_date DATE NOT NULL,
    shift_start TEXT,
    shift_end TEXT,
    shift_type TEXT,
    trip_ids TEXT[],
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(staff_email, duty_date)
  )
`).then(() => {
  return db.query(`ALTER TABLE staff_schedules ADD COLUMN IF NOT EXISTS shift_type TEXT`);
}).catch(err => console.error('Staff schedules table error:', err));

/**
 * GET /api/staff-schedules?email=peter@bkk.hu&month=3&year=2026
 */
router.get('/', async (req, res) => {
  const { email, month, year } = req.query;
  if (!email) return res.status(400).json({ error: 'email kötelező' });

  try {
    const m = parseInt(month) + 1; // JS month is 0-indexed
    const y = parseInt(year);
    const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
    const endDate = `${y}-${String(m).padStart(2, '0')}-${new Date(y, m, 0).getDate()}`;

    const result = await db.query(
      `SELECT * FROM staff_schedules 
       WHERE staff_email = $1 AND duty_date >= $2 AND duty_date <= $3
       ORDER BY duty_date ASC`,
      [email, startDate, endDate]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Schedule fetch error:', err);
    res.status(500).json({ error: 'Hiba a beosztás betöltésekor' });
  }
});

/**
 * POST /api/staff-schedules
 * Beosztás mentése/frissítése (upsert)
 */
router.post('/', async (req, res) => {
  const { staff_email, duty_date, shift_start, shift_end, shift_type, trip_ids, notes } = req.body;
  
  if (!staff_email || !duty_date) {
    return res.status(400).json({ error: 'staff_email és duty_date kötelező' });
  }

  try {
    const result = await db.query(
      `INSERT INTO staff_schedules (staff_email, duty_date, shift_start, shift_end, shift_type, trip_ids, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (staff_email, duty_date) 
       DO UPDATE SET shift_start = $3, shift_end = $4, shift_type = $5, trip_ids = $6, notes = $7
       RETURNING *`,
      [staff_email, duty_date, shift_start || null, shift_end || null, shift_type || null, trip_ids || [], notes || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Schedule save error:', err);
    res.status(500).json({ error: 'Hiba a beosztás mentésekor' });
  }
});

/**
 * DELETE /api/staff-schedules/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM staff_schedules WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Hiba a törléskor' });
  }
});

module.exports = router;
