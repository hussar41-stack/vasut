const { v4: uuidv4 } = require('uuid');

const stops = [
  { id: 's1', name: 'Budapest Keleti', city: 'Budapest', type: 'RAIL' },
  { id: 's2', name: 'Budapest Nyugati', city: 'Budapest', type: 'RAIL' },
  { id: 's3', name: 'Budapest Déli', city: 'Budapest', type: 'RAIL' },
  { id: 's4', name: 'Kelenföld', city: 'Budapest', type: 'RAIL' },
  { id: 's5', name: 'Győr', city: 'Győr', type: 'RAIL' },
  { id: 's6', name: 'Pécs', city: 'Pécs', type: 'RAIL' },
  { id: 's7', name: 'Debrecen', city: 'Debrecen', type: 'RAIL' },
  { id: 's8', name: 'Miskolc', city: 'Miskolc', type: 'RAIL' },
  { id: 's9', name: 'Szolnok', city: 'Szolnok', type: 'RAIL' },
  { id: 's10', name: 'Székesfehérvár', city: 'Székesfehérvár', type: 'RAIL' },
  { id: 's11', name: 'Eger', city: 'Eger', type: 'RAIL' },
  { id: 's12', name: 'Sopron', city: 'Sopron', type: 'RAIL' },
  { id: 's13', name: 'Nyíregyháza', city: 'Nyíregyháza', type: 'RAIL' },
  { id: 's14', name: 'Kecskemét', city: 'Kecskemét', type: 'RAIL' },
  { id: 's15', name: 'Veszprém', city: 'Veszprém', type: 'RAIL' },
];

const routes = [
  { id: 'r1', name: 'IC 700 Intercity', from: 's1', to: 's5', type: 'IC', basePrice: 3490, durationMin: 90 },
  { id: 'r2', name: 'IC 800 Intercity', from: 's1', to: 's7', type: 'IC', basePrice: 4190, durationMin: 150 },
  { id: 'r3', name: 'IC 900 Intercity', from: 's1', to: 's6', type: 'IC', basePrice: 4990, durationMin: 190 },
  { id: 'r4', name: 'S40 Sebesvonat', from: 's2', to: 's8', type: 'FAST', basePrice: 2990, durationMin: 180 },
  { id: 'r5', name: 'G10 Gyorsvonat', from: 's3', to: 's9', type: 'FAST', basePrice: 1990, durationMin: 100 },
  { id: 'r6', name: 'S50 Sebesvonat', from: 's1', to: 's12', type: 'FAST', basePrice: 3290, durationMin: 160 },
  { id: 'r7', name: 'IC 110 Intercity', from: 's1', to: 's11', type: 'IC', basePrice: 3790, durationMin: 130 },
  { id: 'r8', name: 'G20 Gyorsvonat', from: 's2', to: 's13', type: 'FAST', basePrice: 3990, durationMin: 175 },
  { id: 'r9', name: 'S60 Személyvonat', from: 's4', to: 's14', type: 'LOCAL', basePrice: 1490, durationMin: 120 },
  { id: 'r10', name: 'IC 210 Intercity', from: 's3', to: 's15', type: 'IC', basePrice: 2790, durationMin: 95 },
];

// Generate trips for the next 7 days
function generateTrips() {
  const trips = [];
  const departureTimes = ['05:30', '07:00', '08:45', '10:15', '12:00', '13:30', '15:00', '17:30', '19:00', '21:00'];

  routes.forEach(route => {
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date();
      date.setDate(date.getDate() + dayOffset);
      const dateStr = date.toISOString().split('T')[0];

      departureTimes.slice(0, 5 + Math.floor(Math.random() * 5)).forEach(time => {
        const [h, m] = time.split(':').map(Number);
        const depDate = new Date(`${dateStr}T${time}:00`);
        const arrDate = new Date(depDate.getTime() + route.durationMin * 60000);
        const delayMin = Math.random() < 0.25 ? Math.floor(Math.random() * 30) + 1 : 0;

        trips.push({
          id: uuidv4(),
          routeId: route.id,
          routeName: route.name,
          type: route.type,
          from: route.from,
          to: route.to,
          fromName: stops.find(s => s.id === route.from)?.name,
          toName: stops.find(s => s.id === route.to)?.name,
          departureTime: depDate.toISOString(),
          arrivalTime: arrDate.toISOString(),
          delayMinutes: delayMin,
          status: delayMin > 0 ? 'DELAYED' : 'ON_TIME',
          basePrice: route.basePrice,
          availableSeats: Math.floor(Math.random() * 150) + 20,
          platform: Math.floor(Math.random() * 10) + 1,
        });
      });
    }
  });

  return trips;
}

let trips = generateTrips();
const tickets = [];

module.exports = { stops, routes, trips, tickets };
