
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '/Users/huszarbarnabas/sajat/backend/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createAdmin() {
  const email = 'bkk.admin@gvk';
  const password = 'admin';
  const name = 'Főadminisztrátor';
  const role = 'ADMIN';

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO UPDATE SET password = $3, role = $4 RETURNING id, name, email, role',
      [name, email, passwordHash, role]
    );
    console.log('Admin user created/updated:');
    console.table(result.rows);
  } catch (err) {
    console.error('Error creating admin:', err.message);
  } finally {
    await pool.end();
  }
}

createAdmin();
