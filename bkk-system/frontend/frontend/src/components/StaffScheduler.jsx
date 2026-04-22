import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Save, User, Clock, FileText, Bus, Trash2, Download } from 'lucide-react';
import { API_URL } from '../config';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const SHIFT_TYPES = [
  { id: 'reggeli', label: 'Reggeli műszak', start: '04:30', end: '12:30', color: '#fbbf24' },
  { id: 'delutani', label: 'Délutáni műszak', start: '12:30', end: '20:30', color: '#009fe3' },
  { id: 'ejszakai', label: 'Éjszakai műszak', start: '20:30', end: '04:30', color: '#8D2582' },
  { id: 'osztatlan', label: 'Osztatlan műszak', start: '06:00', end: '18:00', color: '#ef4444' },
  { id: 'szabad', label: 'Szabadnap', start: '', end: '', color: '#333' },
];

const BKK_LINES = [
  '7-es busz', '7E busz', '9-es busz', '99-es busz', '30-as busz',
  '4-6 villamos', '2-es villamos', '1-es villamos', '17-es villamos', '19-es villamos',
  'M2 metró', 'M3 metró', 'M4 metró',
  '70-es troli', '72-es troli', '74-es troli',
  'H5 HÉV', 'H6 HÉV', 'H7 HÉV'
];

export default function StaffScheduler() {
  const [staff, setStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState({});
  const [editingDay, setEditingDay] = useState(null);
  const [formData, setFormData] = useState({ shift_type: 'reggeli', start: '04:30', end: '12:30', notes: '', trips: '' });

  useEffect(() => { fetchStaff(); }, []);

  useEffect(() => {
    if (selectedStaff) fetchSchedules();
  }, [selectedStaff, currentDate]);

  const fetchStaff = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/chat/contacts`);
      const staffList = res.data || [];
      setStaff(staffList);
      if (staffList.length > 0) setSelectedStaff(staffList[0]);
    } catch (e) {
      // Fallback ha a contacts nem érhető el
      setStaff([
        { id: 1, name: 'Kovács Péter', role: 'ENGINEER', email: 'peter@bkk.hu', location: 'Kelenföldi Garázs' },
        { id: 2, name: 'Szabó Mária', role: 'ENGINEER', email: 'maria@bkk.hu', location: 'Baross Kocsiszín' },
        { id: 3, name: 'Nagy László', role: 'ENGINEER', email: 'laszlo@bkk.hu', location: 'Kőér utca' },
        { id: 4, name: 'Tóth Anna', role: 'CONDUCTOR', email: 'anna@bkk.hu', location: 'Deák tér' },
        { id: 5, name: 'Varga Béla', role: 'ENGINEER', email: 'bela@bkk.hu', location: 'Pongrác Garázs' },
      ]);
    }
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
      (res.data || []).forEach(s => {
        const d = new Date(s.duty_date).getDate();
        schedMap[d] = s;
      });
      setSchedules(schedMap);
    } catch (e) { setSchedules({}); }
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const handleDayClick = (day) => {
    const existing = schedules[day] || {};
    setEditingDay(day);
    const shiftType = SHIFT_TYPES.find(s => s.id === existing.shift_type) || SHIFT_TYPES[0];
    setFormData({
      shift_type: existing.shift_type || 'reggeli',
      start: existing.shift_start || shiftType.start,
      end: existing.shift_end || shiftType.end,
      notes: existing.notes || '',
      trips: existing.trip_ids ? existing.trip_ids.join(', ') : ''
    });
  };

  const handleShiftTypeChange = (typeId) => {
    const st = SHIFT_TYPES.find(s => s.id === typeId);
    setFormData({ ...formData, shift_type: typeId, start: st.start, end: st.end });
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
        shift_type: formData.shift_type,
        trip_ids: formData.trips.split(',').map(t => t.trim()).filter(t => t),
        notes: formData.notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setEditingDay(null);
      fetchSchedules();
    } catch (e) { alert("Hiba a mentéskor!"); }
  };

  const getRoleIcon = (role) => {
    if (!role) return '👤';
    const r = role.toUpperCase();
    if (r.includes('ENGINEER')) return '🚌';
    if (r.includes('CONDUCTOR')) return '👥';
    return '👤';
  };

  const getShiftColor = (day) => {
    const sched = schedules[day];
    if (!sched) return 'transparent';
    const st = SHIFT_TYPES.find(s => s.id === sched.shift_type);
    return st ? st.color + '30' : 'rgba(141,37,130,0.15)';
  };

  const getShiftBorder = (day) => {
    const sched = schedules[day];
    if (!sched) return '1px solid #333';
    const st = SHIFT_TYPES.find(s => s.id === sched.shift_type);
    return `1px solid ${st ? st.color : '#8D2582'}`;
  };

  const today = new Date();
  const isToday = (day) => {
    return day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
  };

  const generatePDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const monthName = currentDate.toLocaleString('hu-HU', { month: 'long', year: 'numeric' });
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const now = new Date();
    const docNum = `GVK-CERT-${currentDate.getFullYear()}${String(currentDate.getMonth()+1).padStart(2,'0')}-${String(selectedStaff?.id?.substring(0,4) || '0000')}`;

    // --- Page Border ---
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.rect(5, 5, pw - 10, ph - 10, 'S');

    // --- Modern Header ---
    doc.setFillColor(141, 37, 130); // BKK Purple
    doc.rect(0, 0, pw, 35, 'F');
    
    // Abstract accents
    doc.setFillColor(161, 57, 150);
    doc.rect(pw - 80, 0, 80, 35, 'F');
    doc.setFillColor(181, 77, 170);
    doc.rect(pw - 40, 0, 40, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('BKK FUTÁR | MŰSZAKTERV', 15, 15);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('FORGALOMIRÁNYÍTÁSI KÖZPONT (GVK) — HIVATALOS VEZÉNYLÉS', 15, 22);

    // Header Right
    doc.setFontSize(8);
    doc.text(`IKTATÓSZÁM: ${docNum}`, pw - 15, 12, { align: 'right' });
    doc.text(`KIÁLLÍTVA: ${now.toLocaleString('hu-HU')}`, pw - 15, 18, { align: 'right' });
    doc.text(`ERŐSZAK: ${monthName.toUpperCase()}`, pw - 15, 24, { align: 'right' });

    // --- HOURS CALCULATION ---
    let totalHours = 0;
    const wDays = Object.values(schedules).filter(s => s.shift_type && s.shift_type !== 'szabad').length;
    Object.values(schedules).forEach(s => {
      if (s.shift_type !== 'szabad' && s.shift_start && s.shift_end) {
        const [sh, sm] = s.shift_start.split(':').map(Number);
        const [eh, em] = s.shift_end.split(':').map(Number);
        let diff = (eh * 60 + em) - (sh * 60 + sm);
        if (diff < 0) diff += 24 * 60;
        totalHours += diff / 60;
      }
    });
    const mandatoryH = wDays * 8;
    const overtimeH = Math.max(0, totalHours - mandatoryH);
    const tH = Math.floor(totalHours);
    const tM = Math.round((totalHours - tH) * 60);

    // --- EMPLOYEE SUMMARY ---
    doc.setFillColor(252, 252, 254);
    doc.rect(10, 40, pw - 20, 25, 'F');
    doc.setDrawColor(141, 37, 130);
    doc.setLineWidth(0.5);
    doc.line(10, 40, 10, 65);

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('SZEMÉLYZETI ÖSSZESÍTŐ', 15, 47);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Dolgózó: ${selectedStaff?.name || '---'}`, 15, 54);
    doc.text(`Beosztás: ${selectedStaff?.role || '---'}`, 90, 54);
    doc.text(`Helyszín: ${selectedStaff?.location || '---'}`, 170, 54);
    
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.1);
    doc.line(15, 57, pw - 15, 57);

    doc.text(`Összes munkaóra: ${tH} óra ${tM} perc`, 15, 62);
    doc.text(`Előírt munkakeret: ${mandatoryH} óra`, 90, 62);
    doc.text(`Túlóra összesen: ${overtimeH.toFixed(1)} óra`, 170, 62);

    // --- TABLE ---
    const tableData = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const sched = schedules[day];
      const dayOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayName = dayOfWeek.toLocaleString('hu-HU', { weekday: 'long' });
      
      if (sched) {
        const st = SHIFT_TYPES.find(s => s.id === sched.shift_type);
        tableData.push([
          `${day}.`,
          dayName.toUpperCase(),
          st ? st.label : '---',
          sched.shift_type === 'szabad' ? '---' : `${sched.shift_start || ''} — ${sched.shift_end || ''}`,
          sched.trip_ids ? sched.trip_ids.join(', ') : '---',
          sched.notes || ''
        ]);
      } else {
        tableData.push([`${day}.`, dayName.toUpperCase(), '---', '---', '---', '']);
      }
    }

    doc.autoTable({
      startY: 72,
      head: [['NAP', 'DÁTUM', 'MŰSZAK TÍPUS', 'IDŐSZAK', 'JÁRATOK', 'MEGJEGYZÉS']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [141, 37, 130], 
        textColor: 255, 
        fontStyle: 'bold', 
        fontSize: 9, 
        halign: 'center',
        valign: 'middle',
        cellPadding: 3
      },
      bodyStyles: { 
        fontSize: 8, 
        cellPadding: 2.5, 
        textColor: [40, 40, 40],
        valign: 'middle'
      },
      alternateRowStyles: { fillColor: [250, 250, 252] },
      columnStyles: { 
        0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' }, 
        1: { cellWidth: 35 }, 
        2: { cellWidth: 35 }, 
        3: { cellWidth: 35, halign: 'center' }, 
        4: { cellWidth: 80 }, 
        5: { cellWidth: 'auto' } 
      },
      margin: { left: 10, right: 10 }
    });

    // --- SIGNATURES ---
    const lastY = doc.lastAutoTable.finalY + 12;
    if (lastY > ph - 35) { doc.addPage(); }
    const sigBase = lastY > ph - 35 ? 30 : lastY;

    doc.setDrawColor(141, 37, 130);
    doc.setLineWidth(0.3);

    // Disp
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(40, 40, 40);
    doc.text('KIÁLLÍTOTTA (GVK DISZPÉCSER)', 15, sigBase);
    doc.line(15, sigBase + 12, 100, sigBase + 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`DÁTUM: ${now.toLocaleDateString('hu-HU')}`, 15, sigBase + 16);

    // Staff
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('ÁTVETTE (DOLGOZÓ)', pw / 2 + 10, sigBase);
    doc.line(pw / 2 + 10, sigBase + 12, pw - 15, sigBase + 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`NÉV: ${selectedStaff?.name || '---'}`, pw / 2 + 10, sigBase + 16);

    // --- FOOTER ---
    doc.setFillColor(30, 30, 30);
    doc.rect(0, ph - 12, pw, 12, 'F');
    doc.setTextColor(180, 180, 180);
    doc.setFontSize(6);
    doc.text('BUDAPESTI KÖZLEKEDÉSI KÖZPONT ZRT. | GVK VEZÉNYLÉSI RENDSZER | WWW.BKK.HU', 15, ph - 5.5);
    doc.text(`OLDALSZÁM: 1/1 | IKTATÓSZÁM: ${docNum}`, pw - 15, ph - 5.5, { align: 'right' });

    doc.save(`BKK_MASTER_SCHEDULE_${docNum}.pdf`);
  };

  return (
    <div className="fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Vezénylés & Beosztás</h1>
          <p style={{ color: '#666', fontSize: '0.85rem', margin: '5px 0 0' }}>BKK személyzet havi műszakbeosztása</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Személyzet választó */}
          <select 
            value={selectedStaff?.email || ''} 
            onChange={(e) => setSelectedStaff(staff.find(s => s.email === e.target.value))}
            style={{ background: '#1a1a1a', color: 'white', border: '1px solid #333', padding: '10px 15px', borderRadius: '8px', outline: 'none', fontSize: '0.85rem' }}
          >
            {staff.map(s => (
              <option key={s.email} value={s.email}>{getRoleIcon(s.role)} {s.name} — {s.location || s.role}</option>
            ))}
          </select>
          
          {/* Hónap váltó */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1a1a1a', padding: '6px 16px', borderRadius: '8px', border: '1px solid #333' }}>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()-1, 1))} style={iconBtnStyle}><ChevronLeft size={18} /></button>
            <span style={{ fontWeight: 600, minWidth: '140px', textAlign: 'center', fontSize: '0.9rem' }}>
              {currentDate.toLocaleString('hu-HU', { month: 'long', year: 'numeric' }).toUpperCase()}
            </span>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()+1, 1))} style={iconBtnStyle}><ChevronRight size={18} /></button>
          </div>

          <button onClick={generatePDF} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '8px', background: 'rgba(141,37,130,0.15)', border: '1px solid #8D2582', color: '#c13db4', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
            <Download size={16} /> PDF Letöltés
          </button>
        </div>
      </header>

      {/* Műszak típus jelmagyarázat */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {SHIFT_TYPES.map(st => (
          <div key={st.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#888' }}>
            <div style={{ width: 10, height: 10, borderRadius: '3px', background: st.color }} />
            {st.label}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
        {/* Naptár */}
        <div style={{ background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333', padding: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', marginBottom: '8px' }}>
            {['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'].map(d => (
              <div key={d} style={{ fontSize: '0.75rem', color: '#666', fontWeight: 'bold', padding: '5px' }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
            {[...Array(firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1)].map((_, i) => <div key={`e-${i}`} />)}
            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const sched = schedules[day];
              const shiftInfo = sched ? SHIFT_TYPES.find(s => s.id === sched.shift_type) : null;
              return (
                <div 
                  key={day} 
                  onClick={() => handleDayClick(day)}
                  style={{
                    minHeight: '85px', padding: '8px', borderRadius: '10px', cursor: 'pointer',
                    background: getShiftColor(day),
                    border: day === editingDay ? '2px solid #8D2582' : getShiftBorder(day),
                    position: 'relative',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ 
                    fontSize: '0.8rem', fontWeight: isToday(day) ? 'bold' : '500', 
                    color: isToday(day) ? '#8D2582' : 'white',
                    marginBottom: '4px'
                  }}>
                    {day}
                    {isToday(day) && <span style={{ fontSize: '0.6rem', marginLeft: '3px', color: '#8D2582' }}>MA</span>}
                  </div>
                  {sched && shiftInfo && (
                    <div style={{ fontSize: '0.65rem' }}>
                      <div style={{ color: shiftInfo.color, fontWeight: 600, marginBottom: '2px' }}>
                        {shiftInfo.id === 'szabad' ? '🏖 Szabad' : `${sched.shift_start}-${sched.shift_end}`}
                      </div>
                      {sched.trip_ids && sched.trip_ids.length > 0 && (
                        <div style={{ color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.6rem' }}>
                          {sched.trip_ids.join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Szerkesztő panel */}
        <div style={{ background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333', padding: '1.5rem', height: 'fit-content' }}>
          {editingDay ? (
            <>
              <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem' }}>
                <CalendarIcon size={18} color="#8D2582" /> 
                {currentDate.toLocaleString('hu-HU', { month: 'long' })} {editingDay}. — {selectedStaff?.name}
              </h3>

              {/* Műszak típus választó */}
              <div style={formGroup}>
                <label style={labelStyle}><Clock size={14} /> Műszak típusa</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {SHIFT_TYPES.map(st => (
                    <button
                      key={st.id}
                      onClick={() => handleShiftTypeChange(st.id)}
                      style={{
                        padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer',
                        background: formData.shift_type === st.id ? st.color + '30' : 'transparent',
                        border: formData.shift_type === st.id ? `1px solid ${st.color}` : '1px solid #333',
                        color: formData.shift_type === st.id ? st.color : '#666'
                      }}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Idő */}
              {formData.shift_type !== 'szabad' && (
                <div style={formGroup}>
                  <label style={labelStyle}><Clock size={14} /> Pontos idő</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input type="time" value={formData.start} onChange={e => setFormData({...formData, start: e.target.value})} style={inputStyle} />
                    <span style={{ color: '#666', alignSelf: 'center' }}>–</span>
                    <input type="time" value={formData.end} onChange={e => setFormData({...formData, end: e.target.value})} style={inputStyle} />
                  </div>
                </div>
              )}

              {/* Járat hozzárendelés */}
              {formData.shift_type !== 'szabad' && (
                <div style={formGroup}>
                  <label style={labelStyle}><Bus size={14} /> Járat beosztás</label>
                  <input type="text" placeholder="pl. 7-es busz, 4-6 villamos" value={formData.trips} onChange={e => setFormData({...formData, trips: e.target.value})} style={inputStyle} />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '8px' }}>
                    {BKK_LINES.slice(0, 8).map(line => (
                      <button 
                        key={line}
                        onClick={() => {
                          const current = formData.trips.split(',').map(t => t.trim()).filter(t => t);
                          if (!current.includes(line)) setFormData({...formData, trips: [...current, line].join(', ')});
                        }}
                        style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.65rem', cursor: 'pointer', background: '#111', border: '1px solid #333', color: '#888' }}
                      >
                        + {line}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Megjegyzés */}
              <div style={formGroup}>
                <label style={labelStyle}><FileText size={14} /> Megjegyzés</label>
                <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Pl. csere kérés, képzés, stb." style={{...inputStyle, height: '60px', resize: 'none'}} />
              </div>

              <button onClick={handleSave} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#8D2582', color: 'white', border: 'none', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Save size={16} /> BEOSZTÁS MENTÉSE
              </button>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: '#444', padding: '3rem 1rem' }}>
              <CalendarIcon size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>Válassz egy napot a beosztás szerkesztéséhez</p>
              <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: '#333' }}>
                {selectedStaff ? `${selectedStaff.name} — ${selectedStaff.location || selectedStaff.role}` : 'Nincs kiválasztva személyzet'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const iconBtnStyle = { background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' };
const formGroup = { marginBottom: '1.2rem' };
const labelStyle = { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#666', marginBottom: '8px' };
const inputStyle = {
  width: '100%', background: '#111', border: '1px solid #333',
  borderRadius: '6px', padding: '8px 10px', color: 'white', outline: 'none', fontSize: '0.85rem'
};
