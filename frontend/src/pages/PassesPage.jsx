import React, { useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import './PassesPage.css';

const PASS_TYPES = [
  {
    id: 'budapest',
    name: 'Budapest-bérlet (Havi)',
    fullPrice: 8950,
    studentPrice: 945,
    description: 'Érvényes Budapest közigazgatási határán belül minden BKK, MÁV és Volánbusz járaton.',
    icon: '🏙️'
  },
  {
    id: 'country',
    name: 'Országbérlet (Havi)',
    fullPrice: 18900,
    studentPrice: 1890,
    description: 'Érvényes Magyarország egész területén minden MÁV-START, Volánbusz, MÁV-HÉV és GYSEV járaton.',
    icon: '🇭🇺'
  },
  {
    id: 'county',
    name: 'Vármegyebérlet (Havi)',
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
  const { user, isLoggedIn } = useAuth();
  const [selectedPass, setSelectedPass] = useState(null);
  const [isStudent, setIsStudent] = useState(false);
  const [selectedCounty, setSelectedCounty] = useState('Pest');
  const [purchaseStatus, setPurchaseStatus] = useState(null);
  const [error, setError] = useState(null);

  const handlePurchase = async () => {
    if (!isLoggedIn) {
      alert('A bérletvásárláshoz be kell jelentkeznie!');
      return;
    }
    
    setPurchaseStatus('processing');
    setError(null);

    const price = isStudent ? selectedPass.studentPrice : selectedPass.fullPrice;
    
    try {
      const session = await api.createCheckoutSession({
        type: 'PASS',
        passId: selectedPass.id,
        userId: user.id,
        passengerName: user.name || user.email,
        quantity: 1,
        passData: {
          name: `${selectedPass.name}${selectedPass.id === 'county' ? ` (${selectedCounty})` : ''}`,
          price: price,
          description: selectedPass.description,
          isStudent: isStudent
        }
      });

      if (session.url) {
        window.location.href = session.url;
      }
    } catch (err) {
      console.error('Stripe error:', err);
      setError('Hiba történt a fizetés indításakor: ' + err.message);
      setPurchaseStatus(null);
    }
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
