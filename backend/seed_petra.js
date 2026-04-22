require('dotenv').config();
const db = require('./src/db');

async function run() {
  try {
    // 1. Nagy Petra hozzáadása
    const hash = '$2b$10$K.DBqCNrN6l6EDqRiTnw5.4SMGNNwwuzbXZmndEry73VYJTLf/qjK';
    
    const existing = await db.query('SELECT id FROM users WHERE email = $1', ['petra@bkk.hu']);
    let userId;
    
    if (existing.rows.length > 0) {
      userId = existing.rows[0].id;
      console.log('Nagy Petra már létezik, ID:', userId);
    } else {
      const res = await db.query(
        `INSERT INTO users (name, email, password, role, location) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        ['Nagy Petra', 'petra@bkk.hu', hash, 'CONDUCTOR', 'Népliget Állomás']
      );
      userId = res.rows[0].id;
      console.log('Nagy Petra létrehozva! ID:', userId);
    }

    // 2. Havi beosztás generálása - Április 2026
    const year = 2026;
    const month = 4; // április
    
    const shifts = [
      // Hét 1 
      { day: 1, type: 'reggeli', start: '05:00', end: '13:00', line: '7-es busz, M3 metró' },
      { day: 2, type: 'reggeli', start: '05:30', end: '13:30', line: '7-es busz, M3 metró' },
      { day: 3, type: 'delutani', start: '13:00', end: '21:00', line: '4-6 villamos' },
      { day: 4, type: 'szabad', start: '', end: '', line: '' },
      { day: 5, type: 'szabad', start: '', end: '', line: '' },
      // Hét 2
      { day: 6, type: 'delutani', start: '13:00', end: '21:00', line: '4-6 villamos, 2-es villamos' },
      { day: 7, type: 'delutani', start: '12:30', end: '20:30', line: '4-6 villamos' },
      { day: 8, type: 'reggeli', start: '04:30', end: '12:30', line: 'M3 metró' },
      { day: 9, type: 'reggeli', start: '04:30', end: '12:30', line: 'M3 metró' },
      { day: 10, type: 'ejszakai', start: '20:30', end: '04:30', line: '7E busz, 950-es busz' },
      { day: 11, type: 'szabad', start: '', end: '', line: '' },
      { day: 12, type: 'szabad', start: '', end: '', line: '' },
      // Hét 3
      { day: 13, type: 'reggeli', start: '05:00', end: '13:00', line: 'M4 metró' },
      { day: 14, type: 'reggeli', start: '05:00', end: '13:00', line: 'M4 metró' },
      { day: 15, type: 'osztatlan', start: '06:00', end: '18:00', line: 'H5 HÉV', notes: 'Szentendrei rendezvény' },
      { day: 16, type: 'delutani', start: '13:00', end: '21:00', line: '1-es villamos' },
      { day: 17, type: 'delutani', start: '13:00', end: '21:00', line: '1-es villamos, 19-es villamos' },
      { day: 18, type: 'szabad', start: '', end: '', line: '' },
      { day: 19, type: 'szabad', start: '', end: '', line: '' },
      // Hét 4
      { day: 20, type: 'reggeli', start: '04:30', end: '12:30', line: 'M3 metró' },
      { day: 21, type: 'reggeli', start: '05:00', end: '13:00', line: 'M3 metró, 7-es busz' },
      { day: 22, type: 'delutani', start: '12:00', end: '20:00', line: '4-6 villamos' },
      { day: 23, type: 'ejszakai', start: '20:30', end: '04:30', line: '950-es busz, 7E busz' },
      { day: 24, type: 'szabad', start: '', end: '', line: '' },
      { day: 25, type: 'szabad', start: '', end: '', line: '' },
      { day: 26, type: 'reggeli', start: '05:00', end: '13:00', line: 'M4 metró', notes: 'Betanítás új kolléga' },
      // Hét 5
      { day: 27, type: 'reggeli', start: '05:00', end: '13:00', line: 'M4 metró' },
      { day: 28, type: 'delutani', start: '13:00', end: '21:00', line: '2-es villamos' },
      { day: 29, type: 'delutani', start: '12:30', end: '20:30', line: '2-es villamos, 19-es villamos' },
      { day: 30, type: 'reggeli', start: '05:00', end: '13:00', line: '7-es busz' },
    ];

    for (const s of shifts) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(s.day).padStart(2, '0')}`;
      const tripIds = s.line ? s.line.split(', ') : [];
      
      await db.query(
        `INSERT INTO staff_schedules (staff_email, duty_date, shift_start, shift_end, shift_type, trip_ids, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (staff_email, duty_date) 
         DO UPDATE SET shift_start = $3, shift_end = $4, shift_type = $5, trip_ids = $6, notes = $7`,
        ['petra@bkk.hu', dateStr, s.start || null, s.end || null, s.type, tripIds, s.notes || '']
      );
      console.log(`  ✓ ${dateStr}: ${s.type}`);
    }

    console.log('\n✅ Kész! Nagy Petra és 30 napos beosztás hozzáadva.');
    process.exit(0);
  } catch (err) {
    console.error('Hiba:', err);
    process.exit(1);
  }
}

run();
