const { Pool } = require('pg');
require('dotenv').config();

// A DATABASE_URL-t a .env fájlban kell majd megadni.
// Supabase esetén a port 6543 (Transaction mode) vagy 5432 (Direct mode).
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false // Supabase-hez szükséges a biztonságos kapcsolat miatt
  }
});

// Teszteljük a kapcsolatot indításkor
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Adatbázis kapcsolódási hiba:', err.message);
  } else {
    console.log('✅ Sikeres PostgreSQL kapcsolat a Supabase-hez!');
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
