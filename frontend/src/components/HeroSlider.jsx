import React, { useState, useEffect } from 'react';
import './HeroSlider.css';

const MOCK_INFOS = [
  { type: 'alert', text: '🚧 Vágányzár: Budapest-Keleti Pályaudvar felújítás miatt korlátozottan üzemel!' },
  { type: 'info', text: '🚆 Érdekesség: A leggyorsabb InterCity vonatunk eléri a 160 km/h sebességet!' },
  { type: 'news', text: '✨ Új funkció: Próbáld ki a valós idejű menetrendi térképünket!' },
  { type: 'alert', text: '⚠️ FIGYELEM: Viharjelzés a Balaton északi partja mentén közlekedő járatoknál.' },
  { type: 'info', text: '💡 Tudtad? A MÁV mobilalkalmazásával 10% kedvezményt kaphatsz!' },
  { type: 'news', text: '🌟 Hírek: Új prémium fülkék az IC+ kocsikban a maximális kényelemért.' },
  { type: 'info', text: '📅 Emlékeztető: A hónap első vasárnapján ingyenes az utazás a kutyáknak!' },
  { type: 'alert', text: '🔴 Infó: Késések várhatóak a záhonyi vonalon felsővezeték-szakadás miatt.' },
  { type: 'news', text: '🎁 Akció: Vegyél retúrjegyet és nyerj egy belföldi hétvégét!' },
  { type: 'info', text: '🌍 Környezet: A vasúti közlekedéssel 70%-kal csökkented a CO2 lábnyomodat!' }
];

export default function HeroSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);

  // Az illúzióhoz hozzáfűzzük a legelső elemet a lista végére
  const items = [...MOCK_INFOS, MOCK_INFOS[0]];

  useEffect(() => {
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setCurrentIndex(prev => prev + 1);
    }, 2000); // 2 másodperc
    return () => clearInterval(timer);
  }, []);

  const handleTransitionEnd = () => {
    // Ha elértük a klónozott extra utolsó elemet (ami vizuálisan az első)
    if (currentIndex === items.length - 1) {
      setIsTransitioning(false); // Kikapcsoljuk az animációt
      setCurrentIndex(0); // Láthatatlanul "visszaugrunk" a legelsőre!
    }
  };

  return (
    <div className="hero">
      <h1>Utazzon velünk<br /><span>gyorsan és kényelmesen</span></h1>
      <p>Valós idejű menetrend · Interaktív térkép · Azonnali jegyvásárlás · AI Útvonalak</p>

      {/* Dinamikus csúszka / Információs tábla */}
      <div className="hero-slider-container">
        <div 
          className="hero-slider-track" 
          style={{ 
             transform: `translateY(-${currentIndex * 60}px)`, // 60px magasság elementként
             transition: isTransitioning ? 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)' : 'none'
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {items.map((info, idx) => (
            <div key={idx} className={`hero-slider-item ${info.type}`}>
              <span className="info-badge">
                {info.type === 'alert' ? '🔴 FONTOS' : info.type === 'news' ? '🌟 ÚJDONSÁG' : 'ℹ️ INFÓ'}
              </span>
              <span className="info-text">{info.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
