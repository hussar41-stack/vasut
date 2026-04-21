const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'USER',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stops (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT,
  type TEXT DEFAULT 'RAIL',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  trip_id TEXT,
  route_name TEXT,
  from_station TEXT,
  to_station TEXT,
  departure_time TIMESTAMP WITH TIME ZONE,
  price INTEGER,
  type TEXT NOT NULL,
  pass_type TEXT,
  status TEXT DEFAULT 'ACTIVE',
  qr_code TEXT,
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

async function init() {
  try {
    console.log('⏳ Táblák létrehozása...');
    await pool.query(schema);
    console.log('✅ Táblák sikeresen létrehozva (vagy már léteztek).');
    
    // Most szinkronizáljuk a megállókat az inMemoryStore-ból
    const { stops } = require('../src/data/inMemoryStore');
    console.log(`⏳ ${stops.length} megálló szinkronizálása...`);
    
    for (const stop of stops) {
      await pool.query(
        'INSERT INTO stops (id, name, city, type) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name',
        [stop.id, stop.name, stop.city, stop.type]
      );
    }
    
    console.log('✅ Összes megálló szinkronizálva!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Hiba az inicializálás során:', err.message);
    process.exit(1);
  }
}

init();
