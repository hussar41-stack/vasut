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
    
    // Hírek letöltése a backendtől
    const fetchNews = () => {
      api.getNews()
        .then(data => {
          const finalItems = [
            { type: 'clock', text: '' },
            { type: 'weather', text: 'Budapest: 18°C, Derült idő, minimális légmozgás' },
            ...data
          ];
          setNewsData(finalItems);
        })
        .catch(err => {
          console.error("Hírek betöltési hiba:", err);
          if (newsData.length === 0) {
            setNewsData([{ type: 'clock', text: '' }, { type: 'info', text: 'Nem sikerült betölteni az élő híreket.' }]);
          }
        });
    };

    fetchNews();
    const newsTimer = setInterval(fetchNews, 3 * 60 * 1000); // 3 percenkénti frissítés
      
    return () => {
      clearInterval(clockTimer);
      clearInterval(newsTimer);
    };
  }, []);

  const items = newsData.length > 0 ? [...newsData, newsData[0]] : [];

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setCurrentIndex(prev => prev + 1);
    }, 4000); // Kicsit lassabb váltás
    return () => clearInterval(timer);
  }, [items.length]);

  const handleTransitionEnd = () => {
    if (currentIndex === items.length - 1) {
      setIsTransitioning(false);
      setCurrentIndex(0);
    }
  };

  return (
    <div className="hero">
      {/* Statikus Lógó a minta szerint */}
      <div className="hero-static-logo">
        <img src="/logo.png" alt="TransportHU Logo" className="main-logo" />
      </div>

      {/* Dinamikus Hírsáv alatta */}
      <div className="hero-slider-container">
        <div 
          className="hero-slider-track" 
          style={{ 
             transform: `translateY(calc(-${currentIndex} * var(--slider-item-height, 80px)))`, 
             transition: isTransitioning ? 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)' : 'none'
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {items.map((info, idx) => {
            if (info.type === 'clock') {
              return (
                <div key={idx} className="hero-slider-item info">
                  <span className="info-badge clock">🕒 PONTOS IDŐ</span>
                  <span className="info-text">{currentTime.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>
              );
            }
            if (info.type === 'weather') {
              return (
                <div key={idx} className="hero-slider-item info">
                  <span className="info-badge weather">🌤️ IDŐJÁRÁS</span>
                  <span className="info-text">{info.text}</span>
                </div>
              );
            }
            return (
              <div key={idx} className={`hero-slider-item ${info.type}`}>
                <span className="info-badge">
                  {info.type === 'alert' ? '🔴 FONTOS' : info.type === 'news' ? '🌟 ÚJDONSÁG' : 'ℹ️ INFÓ'}
                </span>
                <span className="info-text">
                  {info.text}
                  {info.time && <span className="news-time"> • 🕒 {info.time}</span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
