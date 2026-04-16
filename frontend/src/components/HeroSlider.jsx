import React, { useState, useEffect } from 'react';
import './HeroSlider.css';
import { api } from '../api/client';

// Vercel Force Redeploy Trigger v2
export default function HeroSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [newsData, setNewsData] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Óra frissítése másodpercenként
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // 1. Kezdeti hírek letöltése az AI/Backend-től
    api.getNews()
      .then(data => {
        // Bebiztosítjuk hogy a TransportHU lógó, pontos idő és időjárás is ott legyen
        const finalItems = [
          { type: 'logo', text: '' },
          { type: 'clock', text: '' },
          { type: 'weather', text: 'Budapest: 18°C, Derült idő, minimális légmozgás' },
          ...data
        ];
        setNewsData(finalItems);
      })
      .catch(err => {
        console.error('Hiba a hírek letöltésekor, fallback logó használata:', err);
        setNewsData([{ type: 'logo', text: '' }, { type: 'info', text: 'Nem sikerült betölteni az élő híreket.' }]);
      });
      
    return () => clearInterval(clockTimer);
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
      {/* Dinamikus csúszka / Információs tábla */}
      <div className="hero-slider-container">
        <div 
          className="hero-slider-track" 
          style={{ 
             transform: `translateY(-${currentIndex * 320}px)`, // 320px magasság elementként
             transition: isTransitioning ? 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)' : 'none'
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {items.map((info, idx) => {
            if (info.type === 'logo') {
              return (
                <div key={idx} className="hero-slider-item logo">
                  <img src="/logo.png" alt="TransportHU Logo" />
                </div>
              );
            }
            if (info.type === 'clock') {
              return (
                <div key={idx} className="hero-slider-item info">
                  <span className="info-badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', borderColor: 'rgba(59, 130, 246, 0.3)' }}>🕒 PONTOS IDŐ</span>
                  <span className="info-text">{currentTime.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>
              );
            }
            if (info.type === 'weather') {
              return (
                <div key={idx} className="hero-slider-item info">
                  <span className="info-badge" style={{ backgroundColor: 'rgba(234, 179, 8, 0.2)', color: '#fde047', borderColor: '#ca8a04' }}>🌤️ IDŐJÁRÁS</span>
                  <span className="info-text">{info.text}</span>
                </div>
              );
            }

            return (
              <div key={idx} className={`hero-slider-item ${info.type}`}>
                <span className="info-badge">
                  {info.type === 'alert' ? '🔴 FONTOS' : info.type === 'news' ? '🌟 ÚJDONSÁG' : 'ℹ️ INFÓ'}
                </span>
                <span className="info-text">{info.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
