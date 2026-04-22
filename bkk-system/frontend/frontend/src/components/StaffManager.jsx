import React, { useState, useEffect } from 'react';
import { User, Shield, Briefcase, CheckCircle, Clock } from 'lucide-react';

export default function StaffManager() {
  const [staff, setStaff] = useState([]);
  
  const stations = [
    'Kelenföldi Garázs', 'Cinkotai Garázs', 'Óbudai Garázs', 
    'Dél-pesti Garázs', 'Trolibusz Divízió', 'Baross Kocsiszín', 
    'Angyalföld Kocsiszín', 'M2-M4 Metró Üzem', 'Teleki téri Központ'
  ];

  useEffect(() => {
    setStaff([
      { id: 1, name: 'Kovács János', role: 'BUSZSOFŐR', status: 'ON_DUTY', home_station: 'Kelenföldi Garázs', shift: 'MORNING' },
      { id: 2, name: 'Szabó Mária', role: 'VILLAMOSVEZETŐ', status: 'ON_DUTY', home_station: 'Baross Kocsiszín', shift: 'AFTERNOON' },
      { id: 3, name: 'Nagy László', role: 'METRÓVEZETŐ', status: 'OFF_DUTY', home_station: 'M2-M4 Metró Üzem', shift: 'NIGHT' },
      { id: 6, name: 'Horváth Péter', role: 'UTASKOORDINÁTOR', status: 'ON_DUTY', home_station: 'Teleki téri Központ', shift: 'MORNING' },
      { id: 7, name: 'Kiss Anikó', role: 'BUSZSOFŐR', status: 'ON_DUTY', home_station: 'Óbudai Garázs', shift: 'MORNING' },
      { id: 8, name: 'Varga Tamás', role: 'TROLIBUSZVEZETŐ', status: 'ON_DUTY', home_station: 'Trolibusz Divízió', shift: 'AFTERNOON' },
    ]);
  }, []);

  return (
    <div className="fade-in" style={{ padding: '2rem', background: '#111', minHeight: '100vh', color: 'white' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', margin: 0, color: 'white' }}>BKK Személyzet és Vezénylés</h1>
          <p style={{ color: '#888' }}>Garázsok és kocsiszínek szerinti napi beosztás (FUTÁR)</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
           <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #333', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Export</button>
           <button style={{ background: '#8D2582', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Új vezénylés</button>
        </div>
      </header>

      {stations.map(station => (
        <section key={station} style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.1rem', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', color: 'white' }}>
            <Briefcase size={20} color="#8D2582" /> {station} 
            <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: 400 }}>({staff.filter(s => s.home_station === station).length} aktív fő)</span>
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {staff.filter(s => s.home_station === station).map(person => (
              <div key={person.id} className="glass-panel" style={{ padding: '1.5rem', position: 'relative', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={20} color="#8D2582" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'white' }}>{person.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#888', fontWeight: 'bold' }}>{person.role}</div>
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '0.65rem', padding: '4px 8px', borderRadius: '4px', 
                    background: getShiftBg(person.shift), color: 'white', fontWeight: 'bold', alignSelf: 'start'
                  }}>
                    {getShiftLabel(person.shift)}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#666' }}>
                  <span>Állapot:</span>
                  <span style={{ color: person.status === 'ON_DUTY' ? '#10b981' : 'inherit', fontWeight: 'bold' }}>
                    {person.status === 'ON_DUTY' ? 'SZOLGÁLATBAN' : 'PIHENŐ'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

const getShiftBg = (shift) => {
  if (shift === 'MORNING') return '#ecc94b';
  if (shift === 'AFTERNOON') return '#ed8936';
  if (shift === 'NIGHT') return '#4a5568';
  return 'rgba(255,255,255,0.1)';
};

const getShiftLabel = (shift) => {
  if (shift === 'MORNING') return 'REGGEL (04-12)';
  if (shift === 'AFTERNOON') return 'DÉLUTÁN (12-20)';
  if (shift === 'NIGHT') return 'ÉJSZAKA (20-04)';
  return 'PIHENŐ';
};
