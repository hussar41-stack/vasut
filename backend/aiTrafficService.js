const fetch = require('node-fetch');

// AI-alapú Járműszimulációs Motor (AI Bridge)
// Ha a BKK API lezárt vagy nincs kulcs, az AI a hírek és a menetrend alapján 
// kitalálja (szimulálja) a járművek helyzetét.

async function getAIPredictedVehicles(news, prompt) {
  try {
    const { OpenAI } = require('openai');
    const groq = new OpenAI({ 
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1"
    });

    const aiPrompt = `
      Feladat: Budapest közlekedési diszpécser szimuláció.
      Aktuális hírek: ${JSON.stringify(news)}
      
      Kérlek generálj 30 db Budapesten jelenleg közlekedő járatot.
      Minden járműhöz adj meg egy KÖVETKEZŐ MEGÁLLÓ nevet (stopName), ami valós budapesti megálló az adott vonalon (pl. M3: Göncz Árpád városközpont, 4-6: Széll Kálmán tér, 7: Blaha Lujza tér).
      A járművek koordinátái legyenek VALÓS budapesti útvonalakon.
      
      Válaszolj KIZÁRÓLAG egy JSON tömbbel ebben a formátumban:
      [{"id": "v1", "lat": 47.xxx, "lng": 19.xxx, "label": "4-6", "type": "tram", "routeId": "4", "stopName": "Blaha Lujza tér", "bearing": 90, "color": "#f39c12"}]
    `;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: aiPrompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
    });

    const aiText = completion.choices[0].message.content.trim();
    const cleanJson = aiText.replace(/^```json/i, '').replace(/```$/i, '').trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error('AI Szimuláció hiba:', err.message);
    return null;
  }
}

async function getAIPredictedTrains(news) {
  try {
    const { OpenAI } = require('openai');
    const groq = new OpenAI({ 
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1"
    });

    const aiPrompt = `
      Feladat: MÁV-START vasúti diszpécser szimuláció.
      Aktuális közlekedési hírek: ${JSON.stringify(news)}
      
      Kérlek generálj 15 db Magyarországon (MÁV vonalakon) jelenleg közlekedő vonatot (InterCity, Railjet, EuroCity, Személy).
      Főbb vonalak: Budapest-Győr-Hegyeshalom, Budapest-Székesfehérvár, Budapest-Debrecen, Budapest-Miskolc, Budapest-Szeged, Budapest-Pécs.
      Vedd figyelembe az aktuális késéseket vagy vonali információkat a hírekből.
      Válaszolj KIZÁRÓLAG egy JSON tömbbel ebben a formátumban:
      [{"id": "t1", "lat": 47.xxx, "lng": 18.xxx, "label": "IC 922", "type": "IC", "route": "InterCity", "stopName": "Győr", "bearing": 270, "color": "#a78bfa"}]
    `;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: aiPrompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
    });

    const aiText = completion.choices[0].message.content.trim();
    const cleanJson = aiText.replace(/^```json/i, '').replace(/```$/i, '').trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error('MÁV Szimuláció hiba:', err.message);
    return null;
  }
}

module.exports = { getAIPredictedVehicles, getAIPredictedTrains };
