const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createAuthTables() {
  try {
    console.log('--- Database: Creating Auth Tables ---');
    
    // Create admins table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'admin',
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table "admins" ready.');

    // Create staff table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS staff (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50), -- ENGINEER, CONDUCTOR
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table "staff" ready.');

    // Seed initial admin if empty
    const checkAdmin = await pool.query('SELECT * FROM admins WHERE email = $1', ['admin@transporthu.hu']);
    if (checkAdmin.rows.length === 0) {
        await pool.query('INSERT INTO admins (email, password_hash, name, role) VALUES ($1, $2, $3, $4)', 
            ['admin@transporthu.hu', 'admin', 'GVK Diszpécser', 'admin']);
        console.log('✅ Default admin seeded.');
    }

    // Seed initial staff if empty
    const checkStaff = await pool.query('SELECT * FROM staff WHERE email = $1', ['peterszabo@transporthu.hu']);
    if (checkStaff.rows.length === 0) {
        await pool.query('INSERT INTO staff (email, password_hash, name, role) VALUES ($1, $2, $3, $4)', 
            ['peterszabo@transporthu.hu', 'péter', 'Szabó Péter', 'ENGINEER']);
        console.log('✅ Default staff seeded.');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

createAuthTables();
