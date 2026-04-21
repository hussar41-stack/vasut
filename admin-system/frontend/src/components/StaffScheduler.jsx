import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Save, User, Clock, FileText } from 'lucide-react';
import { API_URL } from '../config';

export default function StaffScheduler() {
  const [staff, setStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState({});
  const [editingDay, setEditingDay] = useState(null);
  const [formData, setFormData] = useState({ start: '08:00', end: '16:00', notes: '', trips: '' });
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    if (selectedStaff) {
      fetchSchedules();
      setSuggestions([]); // Clear old suggestions while loading
    }
  }, [selectedStaff, currentDate]);

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${API_URL}/api/staff`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStaff(res.rows || res.data || []);
      if (res.data.length > 0) setSelectedStaff(res.data[0]);
    } catch (e) { console.error(e); }
  };

  const fetchSchedules = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const month = currentDate.getMonth();
      const year = currentDate.getFullYear();
      const res = await axios.get(`${API_URL}/api/staff-schedules?email=${selectedStaff.email}&month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const schedMap = {};
      res.data.forEach(s => {
        const d = new Date(s.duty_date).getDate();
        schedMap[d] = s;
      });
      setSchedules(schedMap);
    } catch (e) { console.error(e); }
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const handleDayClick = (day) => {
    const existing = schedules[day] || {};
    setEditingDay(day);
    setFormData({
      start: existing.shift_start || '08:00',
      end: existing.shift_end || '16:00',
      notes: existing.notes || '',
      trips: existing.trip_ids ? existing.trip_ids.join(', ') : ''
    });
    fetchSuggestions(selectedStaff.email);
  };

  const fetchSuggestions = async (email) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${API_URL}/api/admin/staff-suggestions/${email}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuggestions(res.data);
    } catch (e) { console.error(e); }
  };

  const addTripToForm = (trainNum) => {
    const current = formData.trips.split(',').map(t => t.trim()).filter(t => t);
    if (!current.includes(trainNum)) {
        setFormData({...formData, trips: [...current, trainNum].join(', ')});
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(editingDay).padStart(2, '0')}`;
      
      await axios.post(`${API_URL}/api/staff-schedules`, {
        staff_email: selectedStaff.email,
        duty_date: dateStr,
        shift_start: formData.start,
        shift_end: formData.end,
        trip_ids: formData.trips.split(',').map(t => t.trim()).filter(t => t),
        notes: formData.notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setEditingDay(null);
      fetchSchedules();
    } catch (e) { alert("Hiba a mentéskor!"); }
  };

  return (
    <div className="fade-in" style={{ padding: '2rem' }}>
      <header className="calendar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Havi Vezénylés Tervező</h1>
          <p style={{ color: 'var(--text-muted)' }}>Személyzet beosztásának kezelése</p>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select 
            value={selectedStaff?.email} 
            onChange={(e) => setSelectedStaff(staff.find(s => s.email === e.target.value))}
            style={selectStyle}
          >
            {staff.map(s => <option key={s.email} value={s.email}>{s.name} ({s.role})</option>)}
          </select>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(15, 23, 42, 0.5)', padding: '5px 15px', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth()-1)))} style={iconBtnStyle}><ChevronLeft size={18} /></button>
            <span style={{ fontWeight: 600, minWidth: '120px', textAlign: 'center' }}>
              {currentDate.toLocaleString('hu-HU', { month: 'long', year: 'numeric' }).toUpperCase()}
            </span>
            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth()+1)))} style={iconBtnStyle}><ChevronRight size={18} /></button>
          </div>
        </div>
      </header>

      <div className="map-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
        {/* Calendar Grid */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', textAlign: 'center', marginBottom: '10px' }}>
            {['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'].map(d => <div key={d} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
            {[...Array(firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1)].map((_, i) => <div key={`empty-${i}`} />)}
            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const sched = schedules[day];
              return (
                <div 
                  key={day} 
                  onClick={() => handleDayClick(day)}
                  style={{
                    height: '100px', padding: '8px', borderRadius: '12px', cursor: 'pointer',
                    background: day === editingDay ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.3)',
                    border: day === editingDay ? '1px solid var(--accent)' : '1px solid var(--border)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '5px' }}>{day}</div>
                  {sched && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>
                       <div style={{ fontWeight: 600 }}>{sched.shift_start} - {sched.shift_end}</div>
                       <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sched.trip_ids?.join(', ')}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Edit Panel */}
        <div className="glass-panel" style={{ padding: '1.5rem', height: 'fit-content' }}>
          {editingDay ? (
            <>
              <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CalendarIcon size={20} color="var(--accent)" /> {editingDay}. napi beosztás
              </h3>
              <div style={formGroup}>
                <label style={labelStyle}><Clock size={14} /> Műszakidő</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="time" value={formData.start} onChange={e => setFormData({...formData, start: e.target.value})} style={inputStyle} />
                  <input type="time" value={formData.end} onChange={e => setFormData({...formData, end: e.target.value})} style={inputStyle} />
                </div>
              </div>
              <div style={formGroup}>
                <label style={labelStyle}><CalendarIcon size={14} /> Járatok (vesszővel elválasztva)</label>
                <input type="text" placeholder="IC560, IC567" value={formData.trips} onChange={e => setFormData({...formData, trips: e.target.value})} style={inputStyle} />
              </div>
              <div style={formGroup}>
                <label style={labelStyle}><FileText size={14} /> Megjegyzés</label>
                <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} style={{...inputStyle, height: '80px', resize: 'none'}} />
              </div>
              <button 
                onClick={handleSave} 
                className="neon-btn" 
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '1rem' }}
              >
                <Save size={18} /> BEOSZTÁS MENTÉSE
              </button>

              {/* Smart Suggestions Panel */}
              {suggestions.length > 0 && (
                <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                   <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                     Javasolt járatok ({selectedStaff?.location})
                   </h4>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {suggestions.map(s => (
                        <div key={s.id} onClick={() => addTripToForm(s.train_number)} style={{
                            padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
                            border: '1px solid transparent', transition: 'all 0.2s'
                        }} className="suggestion-item">
                           <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{s.train_number}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.departure_station} ➔ {s.arrival_station}</div>
                           </div>
                           <div style={{ background: 'var(--accent)', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>+</div>
                        </div>
                      ))}
                   </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
              <User size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>Válassz egy napot a naptárban a beosztás szerkesztéséhez!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const selectStyle = {
  background: 'rgba(15, 23, 42, 0.8)', color: 'white', border: '1px solid var(--border)',
  padding: '8px 15px', borderRadius: '10px', outline: 'none'
};

const iconBtnStyle = { background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '5px' };

const formGroup = { marginBottom: '1.5rem' };
const labelStyle = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' };
const inputStyle = {
  width: '100%', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--border)',
  borderRadius: '8px', padding: '10px', color: 'white', outline: 'none'
};
