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
      
      Kérlek generálj 30 db Budapesten jelenleg (éjjel/nappal arányosan) közlekedő járatot (M2, M3, M4, 4-6 villamos, 7-es buszcsalád, 100E).
      A járművek koordinátái legyenek VALÓS budapesti útvonalakon (pl. 4-6 a körúton, M3 a Váci út alatt).
      Vedd figyelembe a híreket (ha valahol vágányzár van, oda ne tegyél járművet).
      
      Válaszolj KIZÁRÓLAG egy JSON tömbbel ebben a formátumban:
      [{"id": "v1", "lat": 47.xxx, "lng": 19.xxx, "label": "4-6", "type": "tram", "routeId": "4", "bearing": 90, "color": "#f39c12"}]
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

module.exports = { getAIPredictedVehicles };
