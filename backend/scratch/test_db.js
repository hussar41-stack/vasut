const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('TEST SUCCESS:', res.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('TEST FAILED:', err.message);
    process.exit(1);
  }
}

test();
