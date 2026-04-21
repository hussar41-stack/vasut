const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function initSchedules() {
  try {
    console.log('--- Database Initialization: Staff Schedules ---');
    
    // Create staff_schedules table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS staff_schedules (
        id SERIAL PRIMARY KEY,
        staff_email VARCHAR(255) NOT NULL,
        duty_date DATE NOT NULL,
        shift_start TIME,
        shift_end TIME,
        trip_ids TEXT[], -- Array of Trip IDs assigned
        notes TEXT,
        status VARCHAR(50) DEFAULT 'ASSIGNED', -- ASSIGNED, COMPLETED, ON_LEAVE
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(staff_email, duty_date)
      )
    `);
    
    console.log('✅ Table "staff_schedules" created or already exists.');
    
    // Seed some demo data
    const demoEmail = 'peterszabo@transporthu.hu';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    await pool.query(`
      INSERT INTO staff_schedules (staff_email, duty_date, shift_start, shift_end, trip_ids, notes)
      VALUES ($1, $2, '07:30', '15:30', ARRAY['IC560', 'IC567'], 'Vigyázz a lassújelekre!')
      ON CONFLICT (staff_email, duty_date) DO NOTHING
    `, [demoEmail, tomorrowStr]);

    console.log('✅ Demo schedule seeded for tomorrow.');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during init:', err.message);
    process.exit(1);
  }
}

initSchedules();
