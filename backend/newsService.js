const Parser = require('rss-parser');
const { OpenAI } = require('openai');
const parser = new Parser();

// Backup mock adatok ha nincs API kulcs vagy hiba van
const MOCK_INFOS = [
  { type: 'alert', text: '🚧 Vágányzár: Budapest-Keleti Pályaudvar felújítás miatt korlátozottan üzemel!' },
  { type: 'info', text: '🚆 Érdekesség: A leggyorsabb InterCity vonatunk eléri a 160 km/h sebességet!' },
  { type: 'news', text: '✨ Új funkció: Próbáld ki a valós idejű menetrendi térképünket!' },
  { type: 'alert', text: '⚠️ FIGYELEM: Viharjelzés a Balaton északi partja mentén közlekedő járatoknál.' },
  { type: 'info', text: '💡 Tudtad? A MÁV mobilalkalmazásával 10% kedvezményt kaphatsz!' }
];

let cachedNews = null;
let lastFetchTime = 0;

const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 perc

async function getLatestNews() {
  const now = Date.now();
  if (cachedNews && (now - lastFetchTime) < CACHE_DURATION_MS) {
    return cachedNews;
  }

  try {
    let rawNewsTexts = [];

    // 1. Megpróbáljuk behúzni a BKK RSS feedjét
    try {
      const bkkFeed = await parser.parseURL('https://bkk.hu/apps/bkkinfo/rss.php');
      const bkkItems = bkkFeed.items.slice(0, 3).map(i => `BKK: ${i.title}`);
      rawNewsTexts.push(...bkkItems);
    } catch (e) {
      console.warn('Elérhetetlen BKK RSS:', e.message);
    }

    // 2. Megpróbáljuk a MÁVINFORM-ot
    try {
      // Megjegyzés: A MÁV RSS feed URL néha változik, itt egy általános feedet próbálunk
      const mavFeed = await parser.parseURL('https://www.mavcsoport.hu/mavinform/rss.xml');
      const mavItems = mavFeed.items.slice(0, 3).map(i => `MÁV: ${i.title}`);
      rawNewsTexts.push(...mavItems);
    } catch (e) {
      console.warn('Elérhetetlen MÁV RSS:', e.message);
    }

    if (rawNewsTexts.length === 0) {
      throw new Error('Nem jött valós adat az RSS csatornákon keresztül.');
    }

    // Egyszerű HTML és HTML entity dekódoló + szöveg rövidítő
    const sanitize = (str) => {
      if (!str) return '';
      // HTML, CDATA és egyebek eltávolítása
      let clean = str.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
                     .replace(/<[^>]*>?/gm, '')
                     .replace(/\r?\n|\r/g, ' ')
                     .replace(/\t/g, ' ')
                     .trim();
                     
      // HTML entitások feldolgozása (decimális, hexadecimális és gyakoriak)
      clean = clean.replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
                   .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
                   .replace(/&aacute;/gi, 'á').replace(/&eacute;/gi, 'é')
                   .replace(/&iacute;/gi, 'í').replace(/&oacute;/gi, 'ó')
                   .replace(/&ouml;/gi, 'ö').replace(/&uacute;/gi, 'ú')
                   .replace(/&uuml;/gi, 'ü').replace(/&quot;/g, '"')
                   .replace(/&apos;/g, "'").replace(/&lt;/g, '<')
                   .replace(/&gt;/g, '>').replace(/&amp;/g, '&')
                   .replace(/&nbsp;/g, ' ')
                   .replace(/\s+/g, ' '); // Dupla szóközök eltávolítása

      // Ha túl hosszú, vágjuk le hogy ne csússzon szét a slider
      if (clean.length > 90) {
        clean = clean.substring(0, 87) + '...';
      }
      return clean;
    };

    // Nincs OpenAI kulcs -> Adjuk vissza a nyers RSS szövegeket AI átirat nélkül (formázva)
    if (!process.env.OPENAI_API_KEY) {
      console.log('Nincs OPENAI_API_KEY, nyers formázott RSS adatok visszaadása.');
      const fallbackNews = rawNewsTexts.map((text, idx) => ({
        type: text.toLowerCase().includes('késés') || text.toLowerCase().includes('pótló') || text.toLowerCase().includes('kimarad') ? 'alert' : 'info',
        text: sanitize(text)
      }));
      cachedNews = fallbackNews;
      lastFetchTime = now;
      return cachedNews;
    }

    // 3. Ha van API kulcs, összefoglaljuk a chatbottal JSON-be
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const prompt = `Az alábbi nyers közlekedési hírfolyamokból (MÁV, BKK) generálj egy JSON tömböt.
Kérések:
1. Foglald össze a híreket röviden, érthetően, professzionális stílusban, maximum 1 mondatban.
2. Csak a legfontosabb 5 hírt tartsd meg!
3. Formátum kötelezően egy JSON tömb, ami ilyen objektumokból áll: {"type": "alert" | "news" | "info", "text": "rövid szöveg"}
4. Sehol máshol ne legyen szöveg, a válaszod CSAK egy valid JSON tömb legyen [] között.

Nyers Hírek:
${rawNewsTexts.join('\\n')}`;

    console.log('AI Hír generálás elindítva az OpenAI segítségével...');
    const chatCompletion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-3.5-turbo',
      temperature: 0.2, // Ne hallucináljon
    });

    const aiRes = chatCompletion.choices[0].message.content.trim();
    // Eltávolítjuk a markdown JSON kereteket ha a GPT betenné
    const cleanJson = aiRes.replace(/^```json/i, '').replace(/```$/i, '').trim();
    
    const parsedNews = JSON.parse(cleanJson);
    
    if (Array.isArray(parsedNews) && parsedNews.length > 0) {
      cachedNews = parsedNews;
      lastFetchTime = now;
      console.log('AI Hírek sikeresen frissítve!');
      return cachedNews;
    } else {
      throw new Error('Érvénytelen JSON formátum az AI-tól.');
    }

  } catch (error) {
    console.error('Hiba a hírek lekérdezésében/generálásában:', error);
    // Hiba esetén visszaadjuk a régi gyorsítótárat, vagy ha az sincs, a Mock adatokat
    return cachedNews || MOCK_INFOS;
  }
}

module.exports = {
  getLatestNews
};
