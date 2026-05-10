const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '../../data/mav.db');
const gtfsDir = path.join(__dirname, '../../data/gtfs_mav');

// Kapcsolódás (vagy új DB létrehozása)
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath); // Töröljük a régit, hogy tiszta lappal induljunk
}
const db = new Database(dbPath);

console.log('📦 Inicializáljuk a MÁV SQLite adatbázist...');

// Sémák létrehozása
db.exec(`
  PRAGMA synchronous = OFF;
  PRAGMA journal_mode = MEMORY;
  
  CREATE TABLE stops (
    stop_id TEXT PRIMARY KEY,
    stop_name TEXT
  );

  CREATE TABLE routes (
    route_id TEXT PRIMARY KEY,
    route_short_name TEXT,
    route_long_name TEXT
  );

  CREATE TABLE trips (
    trip_id TEXT PRIMARY KEY,
    route_id TEXT,
    service_id TEXT,
    trip_headsign TEXT
  );

  CREATE TABLE stop_times (
    trip_id TEXT,
    arrival_time TEXT,
    departure_time TEXT,
    stop_id TEXT,
    stop_sequence INTEGER
  );

  CREATE TABLE calendar (
    service_id TEXT PRIMARY KEY,
    monday INTEGER, tuesday INTEGER, wednesday INTEGER,
    thursday INTEGER, friday INTEGER, saturday INTEGER, sunday INTEGER,
    start_date TEXT, end_date TEXT
  );

  CREATE TABLE calendar_dates (
    service_id TEXT,
    date TEXT,
    exception_type INTEGER
  );
`);

console.log('✅ Táblák létrehozva.');

// Segédfüggvény fájl beolvasására
function importCsv(fileName, insertQuery, rowMapper) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(gtfsDir, fileName);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ Kihagyva: ${fileName} nem található.`);
      return resolve();
    }

    const insert = db.prepare(insertQuery);
    const rows = [];
    let count = 0;

    console.log(`⏳ Olvasás: ${fileName}...`);
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        rows.push(rowMapper(data));
        if (rows.length >= 10000) {
           const bulkInsert = db.transaction((items) => {
             for (const item of items) insert.run(item);
           });
           bulkInsert(rows);
           count += rows.length;
           rows.length = 0;
           process.stdout.write(`\r   -> Feldolgozva: ${count} sor`);
        }
      })
      .on('end', () => {
        if (rows.length > 0) {
           const bulkInsert = db.transaction((items) => {
             for (const item of items) insert.run(item);
           });
           bulkInsert(rows);
           count += rows.length;
        }
        console.log(`\n✅ Kész: ${fileName} (${count} sor)`);
        resolve();
      })
      .on('error', reject);
  });
}

async function runImport() {
  try {
    await importCsv('stops.txt', 
      'INSERT INTO stops (stop_id, stop_name) VALUES (@stop_id, @stop_name)', 
      (row) => ({ stop_id: row.stop_id, stop_name: row.stop_name || row.stop_desc })
    );

    await importCsv('routes.txt', 
      'INSERT INTO routes (route_id, route_short_name, route_long_name) VALUES (@route_id, @route_short_name, @route_long_name)', 
      (row) => ({ route_id: row.route_id, route_short_name: row.route_short_name, route_long_name: row.route_long_name })
    );

    await importCsv('trips.txt', 
      'INSERT INTO trips (trip_id, route_id, service_id, trip_headsign) VALUES (@trip_id, @route_id, @service_id, @trip_headsign)', 
      (row) => ({ trip_id: row.trip_id, route_id: row.route_id, service_id: row.service_id, trip_headsign: row.trip_headsign })
    );

    await importCsv('calendar.txt', 
      'INSERT INTO calendar (service_id, monday, tuesday, wednesday, thursday, friday, saturday, sunday, start_date, end_date) VALUES (@service_id, @monday, @tuesday, @wednesday, @thursday, @friday, @saturday, @sunday, @start_date, @end_date)', 
      (row) => ({
         service_id: row.service_id, monday: row.monday, tuesday: row.tuesday, wednesday: row.wednesday,
         thursday: row.thursday, friday: row.friday, saturday: row.saturday, sunday: row.sunday,
         start_date: row.start_date, end_date: row.end_date
      })
    );

    await importCsv('calendar_dates.txt', 
      'INSERT INTO calendar_dates (service_id, date, exception_type) VALUES (@service_id, @date, @exception_type)', 
      (row) => ({ service_id: row.service_id, date: row.date, exception_type: row.exception_type })
    );

    // Stop times utoljára, ez a legnagyobb
    await importCsv('stop_times.txt', 
      'INSERT INTO stop_times (trip_id, arrival_time, departure_time, stop_id, stop_sequence) VALUES (@trip_id, @arrival_time, @departure_time, @stop_id, @stop_sequence)', 
      (row) => ({ trip_id: row.trip_id, arrival_time: row.arrival_time, departure_time: row.departure_time, stop_id: row.stop_id, stop_sequence: row.stop_sequence })
    );

    console.log('🗂 Indexek létrehozása a gyors kereséshez...');
    db.exec(`
      CREATE INDEX idx_stop_times_stop_id ON stop_times(stop_id);
      CREATE INDEX idx_stop_times_trip_id ON stop_times(trip_id);
      CREATE INDEX idx_stops_name ON stops(stop_name);
      CREATE INDEX idx_trips_service ON trips(service_id);
    `);
    console.log('✅ Kész.');

    console.log('🎉 GTFS Import Sikeres!');
  } catch (err) {
    console.error('❌ Hiba történt:', err);
  } finally {
    db.close();
  }
}

runImport();
