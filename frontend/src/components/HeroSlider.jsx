import React, { useState, useEffect } from 'react';
import './HeroSlider.css';
import { api } from '../api/client';

export default function HeroSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [newsData, setNewsData] = useState([]);

  useEffect(() => {
    // 1. Kezdeti hírek letöltése az AI/Backend-től
    api.getNews()
      .then(data => {
        // Bebiztosítjuk hogy a TransportHU lógó legyen a legelső "hír" kocka
        const finalItems = [{ type: 'logo', text: '' }, ...data];
        setNewsData(finalItems);
      })
      .catch(err => {
        console.error('Hiba a hírek letöltésekor, fallback logó használata:', err);
        setNewsData([{ type: 'logo', text: '' }, { type: 'info', text: 'Nem sikerült betölteni az élő híreket.' }]);
      });
  }, []);

  // Az illúzióhoz hozzáfűzzük a legelső elemet a lista végére
  // Csak akkor, ha már van adatunk
  const items = newsData.length > 0 ? [...newsData, newsData[0]] : [];

  useEffect(() => {
    if (items.length <= 1) return;

    const timer = setInterval(() => {
      setIsTransitioning(true);
      setCurrentIndex(prev => prev + 1);
    }, 3500); // 3.5 másodperc
    return () => clearInterval(timer);
  }, [items.length]);

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
             transform: `translateY(-${currentIndex * 80}px)`, // 80px magasság elementként
             transition: isTransitioning ? 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)' : 'none'
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {items.map((info, idx) => (
            <div key={idx} className={`hero-slider-item ${info.type}`}>
              {info.type === 'logo' ? (
                <img src="/logo.png" alt="TransportHU Logo" style={{ height: '60px', objectFit: 'contain' }} />
              ) : (
                <>
                  <span className="info-badge">
                    {info.type === 'alert' ? '🔴 FONTOS' : info.type === 'news' ? '🌟 ÚJDONSÁG' : 'ℹ️ INFÓ'}
                  </span>
                  <span className="info-text">{info.text}</span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
