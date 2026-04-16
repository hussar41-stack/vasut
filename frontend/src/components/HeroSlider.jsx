import React, { useState, useEffect } from 'react';
import './HeroSlider.css';

const MOCK_INFOS = [
  { type: 'alert', text: '🚧 Vágányzár: Budapest-Keleti Pályaudvar felújítás miatt korlátozottan üzemel!' },
  { type: 'info', text: '🚆 Érdekesség: A leggyorsabb InterCity vonatunk eléri a 160 km/h sebességet!' },
  { type: 'news', text: '✨ Új funkció: Próbáld ki a valós idejű menetrendi térképünket!' },
  { type: 'alert', text: '⚠️ FIGYELEM: Viharjelzés a Balaton északi partja mentén közlekedő járatoknál.' },
  { type: 'info', text: '💡 Tudtad? A MÁV mobilalkalmazásával 10% kedvezményt kaphatsz!' }
];

export default function HeroSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Automatikus váltás 5 másodpercenként
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % MOCK_INFOS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hero">
      <h1>Utazzon velünk<br /><span>gyorsan és kényelmesen</span></h1>
      <p>Valós idejű menetrend · Interaktív térkép · Azonnali jegyvásárlás · AI Útvonalak</p>

      {/* Dinamikus csúszka / Információs tábla */}
      <div className="hero-slider-container">
        <div className="hero-slider-track" style={{ transform: `translateY(-${currentIndex * 100}%)` }}>
          {MOCK_INFOS.map((info, idx) => (
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
