const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '/Users/huszarbarnabas/sajat/backend/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const password = 'admin';
  const hash = await bcrypt.hash(password, 10);
  
  const emails = ['bkk.admin@gvk', 'bkk.admin@gvk.hu', 'mav.admin@gvk', 'mav.admin@gvk.hu'];
  
  for (const email of emails) {
    try {
      await pool.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO UPDATE SET password = $3, role = $4',
        ['Adminisztrátor', email, hash, 'ADMIN']
      );
      console.log(`Updated user: ${email}`);
    } catch (err) {
      console.error(`Error updating ${email}:`, err.message);
    }
  }
  await pool.end();
}

main();
