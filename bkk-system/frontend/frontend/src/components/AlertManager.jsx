import React, { useState } from 'react';
import { Megaphone, AlertCircle, XOctagon, Send, Trash2 } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';

export default function AlertManager() {
  const [message, setMessage] = useState('');
  const [level, setLevel] = useState('warning');
  const [activeAlert, setActiveAlert] = useState(null);

  const handlePublish = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.post(`${API_URL}/api/alerts`, 
        { message, level },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActiveAlert(res.data);
    } catch (err) {
      alert("Hiba a riasztás kiküldésekor: " + err.message);
    }
  };

  const handleClear = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_URL}/api/alerts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveAlert(null);
      setMessage('');
    } catch (err) {
      alert("Hiba a törléskor");
    }
  };

  return (
    <div className="fade-in" style={{ padding: '2rem', maxWidth: '800px' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Megaphone color="var(--danger)" /> Válságkezelő Központ
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Hálózati szintű utastájékoztatás és riasztások</p>
      </header>

      {/* Draft Section */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h3 style={{ marginTop: 0, fontSize: '1.1rem' }}>Új riasztás szerkesztése</h3>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={labelStyle}>Üzenet az utasoknak</label>
          <textarea 
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Pl. Rendkívüli időjárás miatt a vonatok +30 perc késéssel közlekednek..."
            style={textareaStyle}
          />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={labelStyle}>Riasztási szint</label>
          <div style={{ display: 'flex', gap: '15px' }}>
            {['info', 'warning', 'danger'].map(lvl => (
              <button 
                key={lvl}
                onClick={() => setLevel(lvl)}
                style={{
                  ...levelBtnStyle,
                  borderColor: level === lvl ? getLevelColor(lvl) : 'var(--border)',
                  color: level === lvl ? getLevelColor(lvl) : 'var(--text-muted)',
                  background: level === lvl ? `${getLevelColor(lvl)}10` : 'transparent'
                }}
              >
                {lvl.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={handlePublish}
          className="neon-btn" 
          disabled={!message}
          style={{ width: '100%', background: getLevelColor(level), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
        >
          <Send size={18} /> RIASZTÁS ÉLESÍTÉSE A HÁLÓZATON
        </button>
      </div>

      {/* Active Alert Status */}
      {activeAlert && (
        <div className="glass-panel fade-in" style={{ padding: '1.5rem', border: `1px solid ${getLevelColor(activeAlert.level)}`, background: `${getLevelColor(activeAlert.level)}05` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ color: getLevelColor(activeAlert.level), fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={18} /> AKTÍV RIASZTÁS ({activeAlert.timestamp})
                </span>
                <button onClick={handleClear} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Trash2 size={16} /> Riasztás törlése
                </button>
            </div>
            <p style={{ margin: 0, fontSize: '1.1rem', fontStyle: 'italic' }}>"{activeAlert.message}"</p>
        </div>
      )}
    </div>
  );
}

const getLevelColor = (level) => {
  if (level === 'info') return '#38bdf8';
  if (level === 'warning') return '#8D2582';
  return '#ef4444';
};

const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' };
const textareaStyle = {
  width: '100%', minHeight: '120px', background: 'rgba(15, 23, 42, 0.5)', 
  border: '1px solid var(--border)', borderRadius: '12px', padding: '15px', 
  color: 'white', outline: 'none', fontSize: '1rem', resize: 'vertical'
};
const levelBtnStyle = {
  flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem'
};
