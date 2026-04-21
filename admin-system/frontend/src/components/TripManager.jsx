import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Search } from 'lucide-react';
import axios from 'axios';

export default function TripManager() {
  const [trips, setTrips] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    route_name: '',
    from_station: '',
    to_station: '',
    departure_time: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    // Itt hívnánk be az összes járatot az adatbázisból
    setTrips([
      { id: 1, route_name: 'S70', from_station: 'Budapest-Nyugati', to_station: 'Vác', departure_time: '18:15', status: 'ACTIVE' },
      { id: 2, route_name: 'Z70', from_station: 'Budapest-Nyugati', to_station: 'Szob', departure_time: '18:25', status: 'ACTIVE' },
    ]);
  }, []);

  const handleCreate = () => {
    setIsAdding(true);
    setFormData({ route_name: '', from_station: '', to_station: '', departure_time: '', status: 'ACTIVE' });
  };

  const handleSave = () => {
    // API hívás mentéshez
    console.log('Mentés:', formData);
    setIsAdding(false);
    setEditingId(null);
  };

  return (
    <div className="fade-in" style={{ padding: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Járatkezelő Központ</h1>
          <p style={{ color: 'var(--text-muted)', margin: '5px 0 0' }}>Teljes körű menetrendi adminisztráció</p>
        </div>
        <button onClick={handleCreate} className="neon-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Új járat felvétele
        </button>
      </header>

      {/* Search Bar */}
      <div className="glass-panel" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <Search size={20} color="var(--text-muted)" />
        <input 
          type="text" 
          placeholder="Járatszám vagy állomás keresése..." 
          style={{ flex: 1, background: 'transparent', border: 'none' }}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Trip Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: 'rgba(15, 23, 42, 0.4)', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <tr>
              <th style={thStyle}>JÁRATSZÁM</th>
              <th style={thStyle}>ÚTVONAL</th>
              <th style={thStyle}>INDULÁS</th>
              <th style={thStyle}>STÁTUSZ</th>
              <th style={thStyle}>MŰVELETEK</th>
            </tr>
          </thead>
          <tbody>
            {isAdding && (
              <tr style={{ background: 'rgba(56, 189, 248, 0.05)', borderBottom: '1px solid var(--accent)' }}>
                <td style={tdStyle}><input type="text" placeholder="Pl. S70" value={formData.route_name} onChange={e => setFormData({...formData, route_name: e.target.value})} /></td>
                <td style={tdStyle}><input type="text" placeholder="Honnan - Hova" value={`${formData.from_station} - ${formData.to_station}`} onChange={e => {
                  const parts = e.target.value.split(' - ');
                  setFormData({...formData, from_station: parts[0], to_station: parts[1] || ''});
                }} /></td>
                <td style={tdStyle}><input type="time" value={formData.departure_time} onChange={e => setFormData({...formData, departure_time: e.target.value})} /></td>
                <td style={tdStyle}>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="ACTIVE">AKTÍV</option>
                    <option value="CANCELLED">TÖRÖLT</option>
                  </select>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleSave} style={{ color: 'var(--success)', background: 'none', border: 'none', cursor: 'pointer' }}><Save size={20}/></button>
                    <button onClick={() => setIsAdding(false)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20}/></button>
                  </div>
                </td>
              </tr>
            )}
            {trips.map(trip => (
              <tr key={trip.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={tdStyle}><b style={{ color: 'var(--accent)' }}>{trip.route_name}</b></td>
                <td style={tdStyle}>{trip.from_station} → {trip.to_station}</td>
                <td style={tdStyle}>{trip.departure_time}</td>
                <td style={tdStyle}>
                  <span style={{ 
                    padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                    background: trip.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: trip.status === 'ACTIVE' ? 'var(--success)' : 'var(--danger)'
                  }}>
                    {trip.status}
                  </span>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <button style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }} title="Szerkesztés"><Edit2 size={16}/></button>
                    <button style={{ color: 'rgba(239, 68, 68, 0.6)', background: 'none', border: 'none', cursor: 'pointer' }} title="Törlés"><Trash2 size={16}/></button>
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

const thStyle = { padding: '16px 24px', fontWeight: 600 };
const tdStyle = { padding: '16px 24px', fontSize: '0.95rem' };
