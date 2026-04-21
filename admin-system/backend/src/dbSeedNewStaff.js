const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function seedNewStaff() {
  try {
    console.log('--- Database Update: New Staff System ---');
    
    // Add location column if not exists
    await pool.query('ALTER TABLE staff ADD COLUMN IF NOT EXISTS location VARCHAR(100)');
    
    // Clear old staff (Optional: User said delete demo names)
    await pool.query('DELETE FROM staff');
    console.log('✅ Old staff cleared.');

    const newStaff = [
      { email: 'simonstella@transporthu.hu', pass: 'stella', name: 'Simon Stella', role: 'ENGINEER', loc: 'Székesfehérvár' },
      { email: 'kovacsbalazs@transporthu.hu', pass: 'balázs', name: 'Kovács Balázs', role: 'CONDUCTOR', loc: 'Budapest' },
      { email: 'totheszter@transporthu.hu', pass: 'eszter', name: 'Tóth Eszter', role: 'ENGINEER', loc: 'Győr' },
      { email: 'molnaradam@transporthu.hu', pass: 'ádám', name: 'Molnár Ádám', role: 'CONDUCTOR', loc: 'Székesfehérvár' }
    ];

    for (const s of newStaff) {
      await pool.query(
        'INSERT INTO staff (email, password_hash, name, role, location) VALUES ($1, $2, $3, $4, $5)',
        [s.email, s.pass, s.name, s.role, s.loc]
      );
      console.log(`✅ Added: ${s.name} (${s.loc})`);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

seedNewStaff();
