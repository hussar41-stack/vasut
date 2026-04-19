const { v4: uuidv4 } = require('uuid');

const stops = [
  'Abda', 'Abony', 'Ács', 'Adony', 'Agárd', 'Ajka', 'Albertirsa', 'Alsógöd', 'Alsónémedi', 'Apaj', 'Aszód', 
  'Bábolna', 'Badacsony', 'Badacsonytomaj', 'Bag', 'Baja', 'Balatonalmádi', 'Balatonberény', 'Balatonboglár', 
  'Balatonfenyves', 'Balatonfüred', 'Balatonfűzfő', 'Balatongyörök', 'Balatonlelle', 'Balatonmáriafürdő', 
  'Balatonszárszó', 'Balatonszemes', 'Balatonszentgyörgy', 'Balatonvilágos', 'Balmazújváros', 'Barcs', 
  'Battonya', 'Bátonyterenye', 'Beled', 'Békéscsaba', 'Biatorbágy', 'Bicske', 'Biharkeresztes', 'Bodajk', 
  'Bonyhád', 'Budaörs', 'Budakalász', 'Budapest-Déli', 'Budapest-Keleti', 'Budapest-Nyugati', 'Budapest-Kelenföld', 
  'Cegléd', 'Celldömölk', 'Csongrád', 'Csorna', 'Csurgó', 'Dabronc', 'Debrecen', 'Decs', 'Devecser', 'Dombóvár', 
  'Dorog', 'Dunakeszi', 'Dunaújváros', 'Ecser', 'Eger', 'Érd', 'Esztergom', 'Fegyvernek', 'Fehérgyarmat', 
  'Felsőgöd', 'Fertőd', 'Fertőszentmiklós', 'Fonyód', 'Füzesabony', 'Gárdony', 'Göd', 'Gödöllő', 'Gyál', 
  'Gyoma', 'Gyömrő', 'Gyöngyös', 'Győr', 'Gyula', 'Hajdúböszörmény', 'Hajdúhadház', 'Hajdúnánás', 
  'Hajdúszoboszló', 'Halásztelek', 'Harkány', 'Hatvan', 'Heves', 'Hódmezővásárhely', 'Hort', 'Hortobágy', 
  'Isaszeg', 'Jákó', 'Jánossomorja', 'Jászapáti', 'Jászberény', 'Jászladány', 'Kál-Kápolna', 'Kalocsa', 
  'Kaposvár', 'Kapuvár', 'Karcag', 'Kazincbarcika', 'Kecskemét', 'Kelebia', 'Kerepes', 'Keszthely', 
  'Kiskőrös', 'Kiskunfélegyháza', 'Kiskunhalas', 'Kiskunlacháza', 'Kismaros', 'Kisújszállás', 'Kisvárda', 
  'Kőbánya-Kispest', 'Komárom', 'Komló', 'Körmend', 'Kőszeg', 'Kunhegyes', 'Kunszentmárton', 'Lajosmizse', 
  'Lengyeltóti', 'Lőrinci', 'Maglód', 'Makó', 'Marcali', 'Martonvásár', 'Mátészalka', 'Mezőberény', 
  'Mezőkövesd', 'Mezőtúr', 'Miskolc-Tiszai', 'Mohács', 'Monor', 'Mór', 'Mosonmagyaróvár', 'Nadap', 
  'Nagyigmánd', 'Nagykanizsa', 'Nagykáta', 'Nagykőrös', 'Nagymaros', 'Nagyatád', 'Nemesgulács', 
  'Nyékládháza', 'Nyergesújfalu', 'Nyírbátor', 'Nyíregyháza', 'Orosháza', 'Oroszlány', 'Ózd', 'Paks', 
  'Pápa', 'Pásztó', 'Pécel', 'Pécs', 'Pétfürdő', 'Pilis', 'Piliscsaba', 'Polgárdi', 'Pomáz', 
  'Püspökladány', 'Putnok', 'Ráckeve', 'Rétság', 'Sárbogárd', 'Sarkad', 'Sárospatak', 'Sárvár', 
  'Sásd', 'Sátoraljaújhely', 'Sellye', 'Siófok', 'Soltvadkert', 'Sopron', 'Sümeg', 'Szabadszállás', 
  'Szarvas', 'Százhalombatta', 'Szécsény', 'Szeged', 'Szeghalom', 'Székesfehérvár', 'Szekszárd', 
  'Szentendre', 'Szentes', 'Szentgotthárd', 'Szentlőrinc', 'Szerencs', 'Szigetvár', 'Szob', 
  'Szolnok', 'Szombathely', 'Tab', 'Tamási', 'Tápiószecső', 'Tapolca', 'Tatabánya', 'Tata', 
  'Téglás', 'Tiszakecske', 'Tiszafüred', 'Tiszaújváros', 'Tokaj', 'Tolna', 'Törökszentmiklós', 
  'Tura', 'Újszász', 'Üllő', 'Vác', 'Várpalota', 'Vecsés', 'Veresegyház', 'Veszprém', 'Villány', 
  'Visegrád', 'Záhony', 'Zalaegerszeg', 'Zalalövő', 'Zalaszentiván', 'Zamárdi', 'Zirc', 'Zsámbék', 'Zsurk'
].map((name, i) => ({ id: `s${i+1}`, name, city: name.split('-')[0], type: 'RAIL' }));

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
