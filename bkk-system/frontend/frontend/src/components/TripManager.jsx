import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Search, Activity } from 'lucide-react';
import axios from 'axios';

export default function TripManager() {
  const [trips, setTrips] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    route_name: '',
    from_station: '',
    to_station: '',
    departure_time: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    setTrips([
      { id: 1, route_name: '4-6', from_station: 'Széll Kálmán tér', to_station: 'Móricz Zsigmond körtér', departure_time: '18:15', status: 'ACTIVE', type: 'tram' },
      { id: 2, route_name: '7', from_station: 'Újpalota, Nyírpalota út', to_station: 'Albertfalva vasútállomás', departure_time: '18:25', status: 'ACTIVE', type: 'bus' },
      { id: 3, route_name: 'M3', from_station: 'Újpest-Központ', to_station: 'Kőbánya-Kispest', departure_time: '18:30', status: 'ACTIVE', type: 'metro' },
      { id: 4, route_name: '1', from_station: 'Bécsi út / Vörösvári út', to_station: 'Kelenföld vasútállomás', departure_time: '18:35', status: 'ACTIVE', type: 'tram' },
      { id: 5, route_name: '72', from_station: 'Zugló vasútállomás', to_station: 'Orczy tér', departure_time: '18:40', status: 'ACTIVE', type: 'trolley' },
    ]);
  }, []);

  const handleCreate = () => {
    setIsAdding(true);
    setFormData({ route_name: '', from_station: '', to_station: '', departure_time: '', status: 'ACTIVE' });
  };

  const handleSave = () => {
    console.log('Mentés:', formData);
    setIsAdding(false);
  };

  return (
    <div className="fade-in" style={{ padding: '2rem', background: '#111', minHeight: '100vh', color: 'white' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', margin: 0, color: 'white' }}>FUTÁR Forgalomkezelés</h1>
          <p style={{ color: '#888', margin: '5px 0 0' }}>Budapesti közösségi közlekedés járatainak adminisztrációja</p>
        </div>
        <button onClick={handleCreate} style={{ 
            background: '#8D2582', border: 'none', color: 'white', padding: '10px 20px', 
            borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
            display: 'flex', alignItems: 'center', gap: '8px' 
        }}>
          <Plus size={18} /> Új járat felvétele
        </button>
      </header>

      {/* Search Bar */}
      <div className="glass-panel" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '15px', background: '#1a1a1a', border: '1px solid #333' }}>
        <Search size={20} color="#666" />
        <input 
          type="text" 
          placeholder="Járatszám (pl. 4-6) vagy végállomás keresése..." 
          style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', outline: 'none' }}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Trip Table */}
      <div className="glass-panel" style={{ overflow: 'hidden', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#0a0a0a', textAlign: 'left', fontSize: '0.85rem', color: '#666' }}>
            <tr>
              <th style={thStyle}>VISZONYLAT</th>
              <th style={thStyle}>ÚTVONAL (VÉGÁLLOMÁSOK)</th>
              <th style={thStyle}>INDULÁS</th>
              <th style={thStyle}>STÁTUSZ</th>
              <th style={thStyle}>MŰVELETEK</th>
            </tr>
          </thead>
          <tbody>
            {trips.map(trip => (
              <tr key={trip.id} style={{ borderBottom: '1px solid #333' }}>
                <td style={tdStyle}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ 
                          minWidth: '40px', height: '28px', 
                          background: trip.type === 'metro' ? '#ef4444' : trip.type === 'tram' ? '#fbbf24' : trip.type === 'trolley' ? '#ef4444' : '#009fe3',
                          borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 'bold', fontSize: '0.9rem', color: trip.type === 'tram' ? 'black' : 'white'
                      }}>
                        {trip.route_name}
                      </div>
                   </div>
                </td>
                <td style={tdStyle}>
                   <span style={{ fontSize: '0.95rem', color: 'white' }}>{trip.from_station}</span>
                   <span style={{ margin: '0 8px', color: '#666' }}>→</span>
                   <span style={{ fontSize: '0.95rem', color: 'white' }}>{trip.to_station}</span>
                </td>
                <td style={tdStyle}><span style={{ color: '#888' }}>{trip.departure_time}</span></td>
                <td style={tdStyle}>
                  <span style={{ 
                    padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700,
                    background: trip.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: trip.status === 'ACTIVE' ? '#10b981' : '#ef4444'
                  }}>
                    {trip.status === 'ACTIVE' ? 'FORGALOMBAN' : 'LEÁLLÍTVA'}
                  </span>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <button style={{ color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}><Edit2 size={16}/></button>
                    <button style={{ color: 'rgba(239, 68, 68, 0.6)', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle = { padding: '16px 24px', fontWeight: 600, color: '#666' };
const tdStyle = { padding: '16px 24px', fontSize: '0.95rem' };
