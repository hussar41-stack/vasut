const fetch = require('node-fetch');

// AI-alapú Járműszimulációs Motor (AI Bridge)
// Ha a BKK API lezárt vagy nincs kulcs, az AI a hírek és a menetrend alapján 
// kitalálja (szimulálja) a járművek helyzetét.

// Állapotkezelés a szerveren az egyenletes mozgáshoz (ne ugráljanak a járművek)
let simulatedBkkCache = [];
let lastBkkSimUpdate = 0;

async function getAIPredictedVehicles(news) {
  const now = Date.now();
  
  // Ha van friss cache, csak mozdítsuk el a járműveket (lineáris haladás)
  if (simulatedBkkCache.length > 0 && (now - lastBkkSimUpdate) < 300000) { // 5 percig tartjuk az AI tervet
    const dt = (now - lastBkkSimUpdate) / 1000; // eltelt másodpercek
    lastBkkSimUpdate = now;

    simulatedBkkCache = simulatedBkkCache.map(v => {
      // Szimulált sebesség: ~0.0001 fok/mp
      const speed = 0.00008;
      const angle = (v.bearing || 0) * (Math.PI / 180);
      return {
        ...v,
        lat: v.lat + Math.cos(angle) * speed * (Math.random() * 0.5 + 0.8),
        lng: v.lng + Math.sin(angle) * speed * 1.5 * (Math.random() * 0.5 + 0.8)
      };
    });
    return simulatedBkkCache;
  }

  // Ha üres a cache vagy elévült, kérjünk újat az AI-tól
  try {
    const { OpenAI } = require('openai');
    const groq = new OpenAI({ 
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1"
    });

    const aiPrompt = `
      Feladat: Budapest közlekedési szimuláció.
      Hírek: ${JSON.stringify(news)}
      Generálj 40 db BKK járatot (M2, M3, M4, 4-6 villamos, 7-es busz, 100E).
      A járművek legyenek VALÓS útvonalakon.
      MEKKORA IRÁNYBA (bearing: 0-360) haladnak? Ez fontos!
      Válaszolj JSON tömbbel:
      [{"id": "v1", "lat": 47.xxx, "lng": 19.xxx, "label": "4-6", "type": "tram", "routeId": "4", "stopName": "Blaha", "bearing": 90, "color": "#f39c12"}]
    `;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: aiPrompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
    });

    const aiText = completion.choices[0].message.content.trim();
    const cleanJson = aiText.replace(/^```json/i, '').replace(/```$/i, '').trim();
    simulatedBkkCache = JSON.parse(cleanJson);
    lastBkkSimUpdate = now;
    return simulatedBkkCache;
  } catch (err) {
    console.error('BKK AI Szimuláció hiba:', err.message);
    return simulatedBkkCache.length > 0 ? simulatedBkkCache : null;
  }
}

// Ugyanez a MÁV-ra is
let simulatedMavCache = [];
let lastMavSimUpdate = 0;

async function getAIPredictedTrains(news) {
  const now = Date.now();
  if (simulatedMavCache.length > 0 && (now - lastMavSimUpdate) < 600000) { // 10 perc
    const dt = (now - lastMavSimUpdate) / 1000;
    lastMavSimUpdate = now;

    simulatedMavCache = simulatedMavCache.map(t => {
      const speed = 0.00015; // A vonat gyorsabb
      const angle = (t.bearing || 0) * (Math.PI / 180);
      return {
        ...t,
        lat: t.lat + Math.cos(angle) * speed,
        lng: t.lng + Math.sin(angle) * speed * 1.5
      };
    });
    return simulatedMavCache;
  }

  try {
    const { OpenAI } = require('openai');
    const groq = new OpenAI({ 
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1"
    });

    const aiPrompt = `
      Generálj 15 vonatot (IC, RAILJET, EC, LOCAL) MÁV fővonalakon.
      Bearing (haladási irány) KÖTELEZŐ!
      JSON tömb: [{"id": "t1", "lat": 47.xxx, "lng": 18.xxx, "label": "IC 922", "type": "IC", "route": "InterCity", "stopName": "Győr", "bearing": 270, "color": "#a78bfa"}]
    `;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: aiPrompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
    });

    const aiText = completion.choices[0].message.content.trim();
    const cleanJson = aiText.replace(/^```json/i, '').replace(/```$/i, '').trim();
    simulatedMavCache = JSON.parse(cleanJson);
    lastMavSimUpdate = now;
    return simulatedMavCache;
  } catch (err) {
    console.error('MÁV AI Szimuláció hiba:', err.message);
    return simulatedMavCache.length > 0 ? simulatedMavCache : null;
  }
}

module.exports = { getAIPredictedVehicles, getAIPredictedTrains };
