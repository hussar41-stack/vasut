
const { Pool } = require('pg');
require('dotenv').config({ path: '/Users/huszarbarnabas/sajat/backend/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkUsers() {
  try {
    const res = await pool.query('SELECT id, name, email, role FROM users');
    console.log('Users in DB:');
    console.table(res.rows);
  } catch (err) {
    console.error('Error fetching users:', err.message);
  } finally {
    await pool.end();
  }
}

checkUsers();
