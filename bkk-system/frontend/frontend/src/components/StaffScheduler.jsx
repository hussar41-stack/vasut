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
    const docNum = `GVK-${currentDate.getFullYear()}${String(currentDate.getMonth()+1).padStart(2,'0')}-${String(selectedStaff?.id || '000').padStart(3,'0')}`;

    // === HEADER ===
    doc.setFillColor(141, 37, 130);
    doc.rect(0, 0, pw, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('BKK FUTÁR | GVK Vezénylés', 15, 13);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Forgalomirányítási Központ — Havi Műszakbeosztás', 15, 21);
    doc.setFontSize(8);
    doc.text(`Iktatószám: ${docNum}`, pw - 15, 12, { align: 'right' });
    doc.text(`Kiállítás: ${now.toLocaleDateString('hu-HU')} ${now.toLocaleTimeString('hu-HU', {hour:'2-digit',minute:'2-digit'})}`, pw - 15, 19, { align: 'right' });
    doc.text(`Érvényesség: ${monthName}`, pw - 15, 26, { align: 'right' });

    // === HOURS CALCULATION ===
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

    // === EMPLOYEE INFO BOX ===
    doc.setFillColor(248, 248, 250);
    doc.rect(10, 36, pw - 20, 20, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(10, 36, pw - 20, 20, 'S');
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Dolgozó:', 14, 42);
    doc.setFont('helvetica', 'normal');
    doc.text(`${selectedStaff?.name || '—'}`, 35, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('Beosztás:', 90, 42);
    doc.setFont('helvetica', 'normal');
    doc.text(`${selectedStaff?.role || '—'}`, 115, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('Telephely:', 170, 42);
    doc.setFont('helvetica', 'normal');
    doc.text(`${selectedStaff?.location || '—'}`, 195, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('E-mail:', 14, 47);
    doc.setFont('helvetica', 'normal');
    doc.text(`${selectedStaff?.email || '—'}`, 35, 47);
    doc.setFont('helvetica', 'bold');
    doc.text('Készítette:', 90, 47);
    doc.setFont('helvetica', 'normal');
    doc.text('GVK Forgalomirányítási Diszpécser', 115, 47);
    doc.setFont('helvetica', 'bold');
    doc.text('Óraszám:', 14, 52);
    doc.setFont('helvetica', 'normal');
    doc.text(`Beosztott: ${tH} óra ${tM} perc  |  Kötelező (${wDays}×8h): ${mandatoryH} óra  |  Túlóra: ${overtimeH.toFixed(1)} óra`, 40, 52);

    // === TABLE ===
    const tableData = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const sched = schedules[day];
      const dayOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayName = dayOfWeek.toLocaleString('hu-HU', { weekday: 'short' });
      
      if (sched) {
        const st = SHIFT_TYPES.find(s => s.id === sched.shift_type);
        tableData.push([
          `${day}. (${dayName})`,
          st ? st.label : '—',
          sched.shift_type === 'szabad' ? '—' : `${sched.shift_start || ''} — ${sched.shift_end || ''}`,
          sched.trip_ids ? sched.trip_ids.join(', ') : '—',
          sched.notes || ''
        ]);
      } else {
        tableData.push([`${day}. (${dayName})`, '—', '—', '—', '']);
      }
    }

    doc.autoTable({
      startY: 60,
      head: [['Nap', 'Műszak típus', 'Időszak', 'Járat beosztás', 'Megjegyzés']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [141, 37, 130], textColor: 255, fontStyle: 'bold', fontSize: 8, halign: 'center' },
      bodyStyles: { fontSize: 7.5, textColor: [30, 30, 30], cellPadding: 2.5 },
      alternateRowStyles: { fillColor: [252, 249, 253] },
      columnStyles: { 0: { cellWidth: 30, fontStyle: 'bold' }, 1: { cellWidth: 35 }, 2: { cellWidth: 35, halign: 'center' }, 3: { cellWidth: 80 }, 4: { cellWidth: 'auto' } },
      didParseCell: function(data) {
        if (data.section === 'body') {
          const type = data.row.raw[1];
          if (type === 'Reggeli műszak') data.cell.styles.textColor = [180, 130, 0];
          if (type === 'Délutáni műszak') data.cell.styles.textColor = [0, 120, 200];
          if (type === 'Éjszakai műszak') data.cell.styles.textColor = [141, 37, 130];
          if (type === 'Osztatlan műszak') data.cell.styles.textColor = [200, 50, 50];
          if (type === 'Szabadnap') { data.cell.styles.fillColor = [240, 240, 240]; data.cell.styles.textColor = [150, 150, 150]; }
        }
      },
      margin: { left: 10, right: 10 }
    });

    // === SIGNATURES ===
    const sigY = doc.lastAutoTable.finalY + 10;
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Készítette:', 15, sigY);
    doc.text('Dolgozó:', pw / 2 + 15, sigY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('GVK Forgalomirányítási Diszpécser', 15, sigY + 5);
    doc.text(`Dátum: ${now.toLocaleDateString('hu-HU')}`, 15, sigY + 10);
    doc.line(15, sigY + 20, 100, sigY + 20);
    doc.text('Aláírás, pecsét', 15, sigY + 24);

    doc.text(`${selectedStaff?.name || '—'}`, pw / 2 + 15, sigY + 5);
    doc.text(`${selectedStaff?.role || '—'} — ${selectedStaff?.location || ''}`, pw / 2 + 15, sigY + 10);
    doc.line(pw / 2 + 15, sigY + 20, pw - 15, sigY + 20);
    doc.text('Dolgozó aláírása', pw / 2 + 15, sigY + 24);

    // === FOOTER ===
    doc.setFillColor(45, 45, 45);
    doc.rect(0, ph - 10, pw, 10, 'F');
    doc.setTextColor(155, 155, 155);
    doc.setFontSize(5.5);
    doc.text('Budapesti Közlekedési Központ Zrt. | 1075 Budapest, Rumbach Sebestyén utca 19-21. | Jelen dokumentum bizalmasan kezelendő.', 15, ph - 4);
    doc.text(`${docNum} | 1/1`, pw - 15, ph - 4, { align: 'right' });

    doc.save(`BKK_Vezenyles_${docNum}_${selectedStaff?.name?.replace(/\s/g, '_') || 'ismeretlen'}.pdf`);
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
