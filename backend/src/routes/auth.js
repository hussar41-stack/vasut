const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'transporthu-secret-2025';

/**
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Név, e-mail és jelszó kötelező' });
    }
    
    // Ellenőrizzük, létezik-e már a felhasználó
    const existing = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Ez az e-mail cím már regisztrált' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    // Mentés az adatbázisba
    const result = await db.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, passwordHash]
    );
    
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Hiba a regisztráció során' });
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ error: 'Hibás e-mail vagy jelszó' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Hibás e-mail vagy jelszó' });

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: { id: user.id, name: user.name, email: user.email }, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Hiba a bejelentkezés során' });
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    res.json(decoded);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
