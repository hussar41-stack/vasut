import React, { useState, useEffect } from 'react';
import { User, Shield, Briefcase, CheckCircle, Clock } from 'lucide-react';

export default function StaffManager() {
  const [staff, setStaff] = useState([]);
  
  const stations = [
    'Budapest-Keleti', 'Budapest-Nyugati', 'Budapest-Déli', 
    'Debrecen', 'Miskolc', 'Szeged', 'Pécs', 'Győr', 
    'Székesfehérvár', 'Szolnok'
  ];

  useEffect(() => {
    setStaff([
      { id: 1, name: 'Kovács János', role: 'ENGINEER', status: 'ON_DUTY', home_station: 'Budapest-Keleti', shift: 'MORNING' },
      { id: 2, name: 'Szabó Mária', role: 'CONDUCTOR', status: 'ON_DUTY', home_station: 'Budapest-Nyugati', shift: 'AFTERNOON' },
      { id: 3, name: 'Nagy László', role: 'ENGINEER', status: 'OFF_DUTY', home_station: 'Debrecen', shift: 'NIGHT' },
      { id: 6, name: 'Horváth Péter', role: 'ENGINEER', status: 'ON_DUTY', home_station: 'Győr', shift: 'MORNING' },
      { id: 7, name: 'Kiss Anikó', role: 'CONDUCTOR', status: 'ON_DUTY', home_station: 'Szeged', shift: 'MORNING' },
    ]);
  }, []);

  return (
    <div className="fade-in" style={{ padding: '2rem' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Személyzeti és Beosztáskezelő</h1>
          <p style={{ color: 'var(--text-muted)' }}>Telepállomás szerinti csoportosítás és napi vezénylés</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
           <button className="neon-btn" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}>Műszakterv Export</button>
           <button className="neon-btn">Új beosztás</button>
        </div>
      </header>

      {stations.map(station => (
        <section key={station} style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Briefcase size={20} color="var(--accent)" /> {station} bázisállomás 
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>({staff.filter(s => s.home_station === station).length} fő)</span>
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {staff.filter(s => s.home_station === station).map(person => (
              <div key={person.id} className="glass-panel" style={{ padding: '1.5rem', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{person.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{person.role}</div>
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px', 
                    background: getShiftBg(person.shift), color: 'white', fontWeight: 'bold', alignSelf: 'start'
                  }}>
                    {getShiftLabel(person.shift)}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span>Jelenlegi állapot:</span>
                  <span style={{ color: person.status === 'ON_DUTY' ? 'var(--success)' : 'inherit' }}>
                    {person.status === 'ON_DUTY' ? 'Aktív szolgálat' : 'Pihenőidő'}
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
  if (shift === 'MORNING') return 'REGGEL (6-14)';
  if (shift === 'AFTERNOON') return 'DÉLUTÁN (14-22)';
  if (shift === 'NIGHT') return 'ÉJSZAKA (22-6)';
  return 'PIHENŐ';
};
