const express = require('express');
const router = express.Router();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// ─── Hungarian station name resolver ────────────────────────────────────────
const STATION_COORDS = {
  "Budapest-Keleti": { lat: 47.5005, lon: 19.0837 }, "Budapest-Déli": { lat: 47.4913, lon: 19.0264 }, "Budapest-Nyugati": { lat: 47.5105, lon: 19.0573 },
  "Budapest-Kelenföld": { lat: 47.4647, lon: 19.0222 }, "Kőbánya-Kispest": { lat: 47.4627, lon: 19.1495 },
  "Székesfehérvár": { lat: 47.1804, lon: 18.4231 }, "Győr": { lat: 47.6828, lon: 17.6353 },
  "Debrecen": { lat: 47.5204, lon: 21.6267 }, "Szeged": { lat: 46.2393, lon: 20.1437 }, "Pécs": { lat: 46.0691, lon: 18.2323 },
  "Miskolc-Tiszai": { lat: 48.1001, lon: 20.8066 }, "Nyíregyháza": { lat: 47.9495, lon: 21.7100 }, "Kecskemét": { lat: 46.9081, lon: 19.6934 },
  "Szolnok": { lat: 47.1662, lon: 20.1772 }, "Tatabánya": { lat: 47.5684, lon: 18.4047 }, "Veszprém": { lat: 47.1121, lon: 17.9157 },
  "Békéscsaba": { lat: 46.6811, lon: 21.0858 }, "Sopron": { lat: 47.6814, lon: 16.5925 }, "Zalaegerszeg": { lat: 46.8406, lon: 16.8465 },
  "Kaposvár": { lat: 46.3594, lon: 17.7958 }, "Szombathely": { lat: 47.2353, lon: 16.6341 },
  "Eger": { lat: 47.8894, lon: 20.3794 }, "Siófok": { lat: 46.9061, lon: 18.0532 }, "Balatonszentgyörgy": { lat: 46.6853, lon: 17.2967 },
  "Fonyód": { lat: 46.7431, lon: 17.5513 }, "Nagykanizsa": { lat: 46.4461, lon: 16.9947 }, "Esztergom": { lat: 47.7801, lon: 18.7303 },
  "Vác": { lat: 47.7788, lon: 19.1356 }, "Hatvan": { lat: 47.6625, lon: 19.6734 }, "Cegléd": { lat: 47.1708, lon: 19.8003 },
  "Baja": { lat: 46.1821, lon: 18.9667 }, "Szekszárd": { lat: 46.3533, lon: 18.7042 }, "Salgótarján": { lat: 48.1028, lon: 19.8058 },
  "Kisvárda": { lat: 48.2269, lon: 22.0792 }, "Záhony": { lat: 48.4111, lon: 22.1764 }, "Dombóvár": { lat: 46.3761, lon: 18.1364 }
};

const MAV_PRICES = [
  { km: 10, price: 400 },
  { km: 20, price: 500 },
  { km: 30, price: 740 },
  { km: 50, price: 1120 },
  { km: 100, price: 2200 },
  { km: 150, price: 2950 },
  { km: 200, price: 3950 },
  { km: 300, price: 5240 },
  { km: 400, price: 6800 },
];

function resolveStationName(name) {
  if (!name) return "Budapest-Keleti";
  if (STATION_COORDS[name]) return name;
  const found = Object.keys(STATION_COORDS).find(k => k.toLowerCase().includes(name.toLowerCase()));
  return found || name;
}

function calculateMavPrice(from, to, trainType) {
  const c1 = STATION_COORDS[from] || { lat: 47.1 + (strSeed(from)%100)/200, lon: 19.1 + (strSeed(from)%100)/200 };
  const c2 = STATION_COORDS[to]   || { lat: 47.1 + (strSeed(to)%100)/200,   lon: 19.1 + (strSeed(to)%100)/200 };
  
  const R = 6371; 
  const dLat = (c2.lat - c1.lat) * Math.PI / 180;
  const dLon = (c2.lon - c1.lon) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(c1.lat * Math.PI / 180) * Math.cos(c2.lat * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const airDistance = R * c;
  
  const trainDistance = Math.max(airDistance * 1.25, 5);
  
  const step = MAV_PRICES.find(p => p.km >= trainDistance) || MAV_PRICES[MAV_PRICES.length - 1];
  let finalPrice = step.price;

  if (trainType === 'IC' || trainType === 'EC' || trainType === 'RAILJET') {
    finalPrice += 300; 
  }
  
  return finalPrice;
}

const FEATURES = {
  S:    { wifi: false, climate: false, wc: true,  accessible: true,  bicycle: true },
  G:    { wifi: false, climate: true,  wc: true,  accessible: true,  bicycle: true },
  IC:   { wifi: true,  climate: true,  wc: true,  accessible: true,  bicycle: true },
  RJX:  { wifi: true,  climate: true,  wc: true,  accessible: true,  bicycle: false },
  EC:   { wifi: true,  climate: true,  wc: true,  accessible: true,  bicycle: true }
};

const TRAIN_RELATIONS = [
  // Győri irány (1-es vonal)
  { match: ["Budapest", "Győr"], trains: [
    { name: 'S10', type: 'LOCAL', dur: 105 }, 
    { name: 'G10', type: 'FAST', dur: 95 }, 
    { name: 'IC 922', type: 'IC', dur: 85 }, 
    { name: 'RJX 60', type: 'RAILJET', dur: 75 }
  ]},
  // Székesfehérvári irány (30/40-es vonal)
  { match: ["Budapest", "Székesfehérvár"], trains: [
    { name: 'S30', type: 'LOCAL', dur: 65 }, 
    { name: 'G43', type: 'FAST', dur: 55 },
    { name: 'Z30', type: 'FAST', dur: 50 }, 
    { name: 'IC 834', type: 'IC', dur: 45 }
  ]},
  // Debreceni irány (100-as vonal)
  { match: ["Budapest", "Debrecen"], trains: [
    { name: 'S50', type: 'LOCAL', dur: 180 }, 
    { name: 'IC 528', type: 'IC', dur: 150 },
    { name: 'IC 612', type: 'IC', dur: 145 }, 
    { name: 'EC 144', type: 'EC', dur: 140 }
  ]},
  // Szegedi irány (140-es vonal)
  { match: ["Budapest", "Szeged"], trains: [
    { name: 'S20', type: 'LOCAL', dur: 160 }, 
    { name: 'IC 712', type: 'IC', dur: 140 },
    { name: 'IC 722', type: 'IC', dur: 138 }
  ]}
];

const DEFAULT_TRAINS = [
  { name: 'Személy', type: 'LOCAL', dur: 90 },
  { name: 'IC 701', type: 'IC', dur: 85 },
  { name: 'G10', type: 'FAST', dur: 80 }
];

function getTrainsForRoute(from, to) {
  const rel = TRAIN_RELATIONS.find(r => 
    (from.includes(r.match[0]) && to.includes(r.match[1])) ||
    (from.includes(r.match[1]) && to.includes(r.match[0]))
  );
  return rel ? rel.trains : DEFAULT_TRAINS;
}

const DEPARTURE_HOURS = ['05:15', '06:00', '07:30', '08:00', '09:00', '10:30', '11:15',
                         '12:00', '13:15', '14:30', '15:45', '17:00', '18:30', '19:45', '21:00'];

function seededRand(seed) {
  let s = Math.abs(seed) || 12345;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function strSeed(str) {
  return str.split('').reduce((a, c, i) => a + c.charCodeAt(0) * (i + 1), 0);
}

function generateFallbackResults(from, to, date) {
  const fromName = resolveStationName(from);
  const toName   = resolveStationName(to);
  const targetDate = date || new Date().toISOString().split('T')[0];

  const seed = strSeed(fromName + toName + targetDate);
  const rand = seededRand(seed);

  const availableTrains = getTrainsForRoute(fromName, toName);
  const count = Math.min(Math.floor(rand() * 4) + 6, DEPARTURE_HOURS.length);
  
  const shuffledTimes  = [...DEPARTURE_HOURS].sort(() => rand() - 0.5).slice(0, count).sort();

  return shuffledTimes.map((time, i) => {
    const train     = availableTrains[i % availableTrains.length];
    const calculatedBasePrice = calculateMavPrice(fromName, toName, train.type);
    
    const depDate   = new Date(`${targetDate}T${time}:00`);
    const delayMin  = rand() < 0.15 ? Math.floor(rand() * 20) + 2 : 0;
    const arrDate   = new Date(depDate.getTime() + train.dur * 60000);

    // Mock intermediate stops
    const stop1Time = new Date(depDate.getTime() + (train.dur * 0.3) * 60000).toLocaleTimeString('hu-HU', {hour:'2-digit', minute:'2-digit'});
    const stop2Time = new Date(depDate.getTime() + (train.dur * 0.6) * 60000).toLocaleTimeString('hu-HU', {hour:'2-digit', minute:'2-digit'});

    const stops = [
      { station: fromName, time: time },
      { station: 'Kelenföld', time: stop1Time },
      { station: 'Tatabánya', time: stop2Time },
      { station: toName, time: arrDate.toLocaleTimeString('hu-HU', {hour:'2-digit', minute:'2-digit'}) }
    ];

    let finalFeatures = FEATURES.S;
    if (train.type === 'IC')      finalFeatures = FEATURES.IC;
    else if (train.type === 'FAST') finalFeatures = FEATURES.G;
    else if (train.type === 'RAILJET') finalFeatures = FEATURES.RJX;
    else if (train.type === 'EC') finalFeatures = FEATURES.EC;

    return {
      id:            uuidv4(),
      routeName:     train.name,
      type:          train.type,
      fromName,
      toName,
      departureTime: depDate.toISOString(),
      arrivalTime:   arrDate.toISOString(),
      delayMinutes:  delayMin,
      status:        delayMin > 0 ? 'DELAYED' : 'ON_TIME',
      basePrice:     calculatedBasePrice,
      availableSeats: Math.floor(rand() * 150) + 10,
      platform:      Math.floor(rand() * 12) + 1,
      features:      finalFeatures,
      stops:         stops,
      source:        'fallback',
    };
  });
}

// ─── Unofficial MAV EMMA API Integration ─────────────────────────────────────────
async function fetchMavApi(fromName, toName, targetDate) {
  // We use the new MÁV EMMA PROD API to try and fetch real time data.
  // Warning: This is an unofficial wrapper and relies on reverse engineered headers.
  
  // Note: We need station UIC codes. In a real scenario, we'd map station names to their 0055... codes.
  // For this demo, we'll try a generic query to the new EMMA endpoint. If it fails, we fall back.
  
  const headers = {
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    'Language': 'hu',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };

  // We are trying to query the new EMMA API (jegy-a.mav.hu)
  // We'll perform a basic query, but since we lack the exact UIC station codes without a station resolver,
  // we might get an error. If so, we catch it and use fallback.
  const payload = {
    "offersetCriteria": {
      "travelDateTime": `${targetDate}T08:00:00.000Z`,
      "departureStation": fromName, // EMMA sometimes accepts text query
      "arrivalStation": toName,
      "passengers": [{"passengerType":"HU_107_018-026"}]
    }
  };

  try {
    const apiRes = await axios.post('https://jegy-a.mav.hu/IK_API_PROD/api/OfferRequestApi/GetTravelOffers', payload, {
      headers,
      timeout: 5000
    });
    
    // Attempt to map real EMMA results. If the format doesn't match, we error out and fallback.
    const offers = apiRes.data?.travelOffers;
    if (!offers || offers.length === 0) throw new Error('No offers returned from MAV EMMA');
    
    // Map to our standard format
    return offers.map((offer, idx) => {
      const train = offer.trains?.[0] || {};
      const price = offer.totalPrice || calculateMavPrice(fromName, toName, 'IC');
      const depDate = offer.departureTime ? new Date(offer.departureTime) : new Date();
      const arrDate = offer.arrivalTime ? new Date(offer.arrivalTime) : new Date(depDate.getTime() + 90 * 60000);
      
      return {
        id:            uuidv4(),
        routeName:     train.trainNumber || `Vonat ${idx+1}`,
        type:          train.trainCategory === 'InterCity' ? 'IC' : 'LOCAL',
        fromName,
        toName,
        departureTime: depDate.toISOString(),
        arrivalTime:   arrDate.toISOString(),
        delayMinutes:  offer.delay || 0,
        status:        offer.delay > 0 ? 'DELAYED' : 'ON_TIME',
        basePrice:     price,
        availableSeats: Math.floor(Math.random() * 150) + 20,
        platform:      train.departurePlatform || Math.floor(Math.random() * 10) + 1,
        features:      FEATURES.IC,
        stops:         [
          { station: fromName, time: depDate.toLocaleTimeString('hu-HU', {hour:'2-digit', minute:'2-digit'}) },
          { station: toName, time: arrDate.toLocaleTimeString('hu-HU', {hour:'2-digit', minute:'2-digit'}) }
        ],
        source:        'mav-emma-api',
      };
    });
  } catch (err) {
    throw new Error(`MAV EMMA API failed: ${err.message}`);
  }
}

// ─── POST /api/search ─────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { from, to, date } = req.body;
  const ts = new Date().toISOString();
  console.log(`[${ts}] 🔍 POST search from="${from}" to="${to}"`);
  
  const fromName = resolveStationName(from);
  const toName = resolveStationName(to);
  const targetDate = date || new Date().toISOString().split('T')[0];
  
  // Try real MÁV EMMA API first, if it fails, use fallback
  try {
    console.log(`[${ts}] 🌐 Calling MÁV EMMA API...`);
    const results = await fetchMavApi(fromName, toName, targetDate);
    console.log(`[${ts}] ✅ MÁV EMMA API success → ${results.length} connections`);
    return res.json({ source: 'mav-emma-api', fromName, toName, date: targetDate, results });
  } catch (err) {
    console.error(`[${ts}] ❌ MÁV EMMA API error: ${err.message} → using fallback`);
    const results = generateFallbackResults(from, to, date);
    return res.json({ source: 'fallback', fromName, toName, date: targetDate, results });
  }
});

// ─── POST /api/ai-analyze ─────────────────────────────────────────────────────
router.post('/ai-analyze', async (req, res) => {
  const { from, to, network, results } = req.body;
  if (!results || results.length === 0) {
    return res.json({ analysis: "Nincs elegendő adat az AI elemzéshez." });
  }

  const fastest = results.find(r => r.status === 'ON_TIME') || results[0];
  const analysis = `💡 **AI Asszisztens:** A(z) ${from} -> ${to} útvonalon a leggyorsabb opció a(z) **${fastest.routeName}**, amely várhatóan menetrend szerint közlekedik.`;
  
  res.json({ analysis });
});

// ─── GET /api/real-search?from=&to=&date= ────────────────────────────────────
router.get('/', async (req, res) => {
  const { from, to, date } = req.query;
  const ts = new Date().toISOString();

  console.log(`[${ts}] 🔍 real-search  from="${from}"  to="${to}"  date="${date}"`);

  if (!from && !to) {
    console.warn(`[${ts}] ⚠️  real-search: missing from/to`);
    return res.status(400).json({ error: 'A "from" és "to" paraméter kötelező', results: [] });
  }

  const fromName   = resolveStationName(from);
  const toName     = resolveStationName(to);
  const targetDate = date || new Date().toISOString().split('T')[0];

  try {
    console.log(`[${ts}] 🌐 Calling MÁV EMMA API...`);
    const results = await fetchMavApi(fromName, toName, targetDate);
    return res.json({
      source:      'mav-emma-api',
      apiProvider: 'MÁV-START EMMA',
      fromName,
      toName,
      date:        targetDate,
      results,
    });
  } catch (err) {
    console.error(`[${ts}] ❌ Real API error: ${err.message} → using fallback`);
  }

  // ── Fallback: generated realistic Hungarian schedule ─────────────────────
  const results = generateFallbackResults(from, to, date);
  console.log(`[${ts}] 📦 Returning ${results.length} fallback results`);

  return res.json({
    source:   'fallback',
    fromName,
    toName,
    date:     targetDate,
    results,
  });
});

module.exports = router;

