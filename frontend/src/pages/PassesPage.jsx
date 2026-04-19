import React, { useState } from 'react';
import './PassesPage.css';

const PASS_TYPES = [
  {
    id: 'country',
    name: 'Országbérlet',
    fullPrice: 18900,
    studentPrice: 1890,
    description: 'Érvényes Magyarország egész területén minden MÁV-START, Volánbusz, MÁV-HÉV és GYSEV járaton.',
    icon: '🇭🇺'
  },
  {
    id: 'county',
    name: 'Vármegyebérlet',
    fullPrice: 9450,
    studentPrice: 945,
    description: 'Érvényes a választott vármegye területén minden helyközi járaton.',
    icon: '🏰'
  }
];

const COUNTIES = [
  'Bács-Kiskun', 'Baranya', 'Békés', 'Borsod-Abaúj-Zemplén', 'Csongrád-Csanád', 
  'Fejér', 'Győr-Moson-Sopron', 'Hajdú-Bihar', 'Heves', 'Jász-Nagykun-Szolnok', 
  'Komárom-Esztergom', 'Nógrád', 'Pest', 'Somogy', 'Szabolcs-Szatmár-Bereg', 
  'Tolna', 'Vas', 'Veszprém', 'Zala'
];

export default function PassesPage() {
  const [selectedPass, setSelectedPass] = useState(null);
  const [isStudent, setIsStudent] = useState(false);
  const [selectedCounty, setSelectedCounty] = useState('Pest');
  const [purchaseStatus, setPurchaseStatus] = useState(null);

  const handlePurchase = () => {
    setPurchaseStatus('processing');
    // Szimulált fizetés
    setTimeout(() => {
      setPurchaseStatus('success');
    }, 2000);
  };

  if (purchaseStatus === 'success') {
    return (
      <div className="passes-container success-view">
        <div className="success-card">
          <div className="success-icon">✅</div>
          <h2>Sikeres vásárlás!</h2>
          <p>A bérletedet rögzítettük a profilodban. Jó utazást kívánunk!</p>
          <button className="btn-primary" onClick={() => setPurchaseStatus(null)}>Vissza a bérletekhez</button>
        </div>
      </div>
    );
  }

  return (
    <div className="passes-container">
      <header className="passes-header">
        <h1>Bérletvásárlás</h1>
        <p>Válassza ki az Önnek megfelelő bérletet a közösségi közlekedéshez.</p>
      </header>

      <div className="pass-selection-grid">
        {PASS_TYPES.map(pass => (
          <div 
            key={pass.id} 
            className={`pass-card ${selectedPass?.id === pass.id ? 'active' : ''}`}
            onClick={() => setSelectedPass(pass)}
          >
            <div className="pass-icon">{pass.icon}</div>
            <h3>{pass.name}</h3>
            <p className="pass-desc">{pass.description}</p>
            <div className="pass-prices">
              <span className="price-tag full">{pass.fullPrice.toLocaleString()} Ft</span>
              <span className="price-tag student">Diák: {pass.studentPrice.toLocaleString()} Ft</span>
            </div>
          </div>
        ))}
      </div>

      {selectedPass && (
        <div className="purchase-config-card">
          <h3>Konfiguráció: {selectedPass.name}</h3>
          
          <div className="config-row">
            <label>Típus:</label>
            <div className="toggle-group">
              <button 
                className={!isStudent ? 'active' : ''} 
                onClick={() => setIsStudent(false)}
              >
                Teljes árú
              </button>
              <button 
                className={isStudent ? 'active' : ''} 
                onClick={() => setIsStudent(true)}
              >
                90% Kedvezmény (Diák)
              </button>
            </div>
          </div>

          {selectedPass.id === 'county' && (
            <div className="config-row">
              <label>Vármegye:</label>
              <select 
                value={selectedCounty} 
                onChange={(e) => setSelectedCounty(e.target.value)}
                className="county-select"
              >
                {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          <div className="purchase-summary">
            <div className="summary-info">
              <span>Fizetendő:</span>
              <span className="final-price">
                {(isStudent ? selectedPass.studentPrice : selectedPass.fullPrice).toLocaleString()} Ft
              </span>
            </div>
            <button 
              className="purchase-btn" 
              onClick={handlePurchase}
              disabled={purchaseStatus === 'processing'}
            >
              {purchaseStatus === 'processing' ? 'Fizetés folyamatban...' : '💎 Vásárlás Stripe-pal'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
