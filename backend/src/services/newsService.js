/**
 * TransportHU News Service
 * Generates dynamic, realistic Hungarian transit news.
 */

const NEWS_POOL = [
  { type: 'traffic', text: '🚧 M3 metró felújítás: Pótlóbuszok közlekednek a déli szakaszon.' },
  { type: 'rail', text: '🚆 Új Stadler KISS emeletes vonatok álltak forgalomba a váci vonalon.' },
  { type: 'alert', text: '🔴 Baleset miatt korlátozás várható az M0-ás autóúton, jelentős a torlódás.' },
  { type: 'promo', text: '🎫 Próbálja ki az új digitális bérletvásárlást a TransportHU alkalmazásban!' },
  { type: 'future', text: '🚉 Megkezdődött a Nyugati pályaudvar tetőszerkezetének következő üteme.' },
  { type: 'weather', text: '⛈️ Viharos szél: Korlátozásokra kell számítani a balatoni hajózásban.' },
  { type: 'info', text: 'ℹ️ Minden járatunk menetrend szerint közlekedik a fővárosban.' }
];

class NewsService {
  constructor() {
    this.currentNews = [...NEWS_POOL];
    // Rotate news every 5 minutes internally
    setInterval(() => this.rotateNews(), 5 * 60 * 1000);
  }

  rotateNews() {
    console.log('🔄 News rotated at ' + new Date().toLocaleTimeString());
    const first = this.currentNews.shift();
    this.currentNews.push(first);
  }

  getNews() {
    const now = new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
    return this.currentNews.map(item => ({
      ...item,
      time: now
    }));
  }
}

module.exports = new NewsService();
