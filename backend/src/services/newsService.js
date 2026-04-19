const Parser = require('rss-parser');
const parser = new Parser();

// Backup mock adatok
const MOCK_INFOS = [
  { type: 'alert', text: '🚧 Vágányzár: Budapest-Keleti Pályaudvar felújítás miatt korlátozottan üzemel!' },
  { type: 'info', text: '🚆 Érdekesség: A leggyorsabb InterCity vonatunk eléri a 160 km/h sebességet!' },
  { type: 'news', text: '✨ Új funkció: Próbáld ki a valós idejű menetrendi térképünket!' },
  { type: 'alert', text: '⚠️ FIGYELEM: Viharjelzés a Balaton északi partja mentén közlekedő járatoknál.' },
  { type: 'info', text: '💡 Tudtad? A MÁV mobilalkalmazásával 10% kedvezményt kaphatsz!' }
];

let cachedNews = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 2 * 60 * 1000; // 2 perc gyorsítótár

class NewsService {
  async getNews() {
    const now = Date.now();
    if (cachedNews && (now - lastFetchTime) < CACHE_DURATION_MS) {
      return cachedNews;
    }

    try {
      let rawNewsTexts = [];
      
      // 1. BKK RSS
      try {
        const bkkFeed = await parser.parseURL('https://bkk.hu/apps/bkkinfo/rss.php');
        rawNewsTexts.push(...bkkFeed.items.slice(0, 3).map(i => `BKK: ${i.title}`));
      } catch (e) { console.warn('BKK RSS hiba'); }

      // 2. MÁV RSS
      try {
        const mavFeed = await parser.parseURL('https://www.mavcsoport.hu/mavinform/rss.xml');
        rawNewsTexts.push(...mavFeed.items.slice(0, 3).map(i => `MÁV: ${i.title}`));
      } catch (e) { console.warn('MÁV RSS hiba'); }

      if (rawNewsTexts.length === 0) return MOCK_INFOS;

      // Egyszerűbb sanitize logika a stabil működésért
      const formatted = rawNewsTexts.map(text => ({
        type: text.toLowerCase().includes('késés') || text.toLowerCase().includes('korlátozás') ? 'alert' : 'info',
        text: text.substring(0, 90),
        time: new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })
      }));

      cachedNews = formatted;
      lastFetchTime = now;
      return cachedNews;
    } catch (error) {
      console.error('Hír szolgáltatás hiba:', error);
      return MOCK_INFOS;
    }
  }
}

module.exports = new NewsService();
