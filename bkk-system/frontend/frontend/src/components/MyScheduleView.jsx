import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Download, Clock, List, Grid, Briefcase, Coffee } from 'lucide-react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { API_URL } from '../config';
import { useAdminAuth } from '../contexts/AdminAuthContext';

const SHIFT_TYPES = {
  reggeli:   { label: 'Reggeli műszak',   short: 'R', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  icon: '🌅' },
  delutani:  { label: 'Délutáni műszak',  short: 'D', color: '#009fe3', bg: 'rgba(0,159,227,0.1)',   icon: '☀️' },
  ejszakai:  { label: 'Éjszakai műszak',  short: 'É', color: '#8D2582', bg: 'rgba(141,37,130,0.1)',  icon: '🌙' },
  osztatlan: { label: 'Osztatlan műszak', short: 'O', color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   icon: '⏰' },
  szabad:    { label: 'Szabadnap',         short: 'SZ', color: '#555',    bg: 'rgba(50,50,50,0.2)',    icon: '🏖' },
};

export default function MyScheduleView() {
  const { admin } = useAdminAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState({});
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'

  useEffect(() => {
    if (admin?.email) fetchSchedules();
  }, [admin, currentDate]);

  const fetchSchedules = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const month = currentDate.getMonth();
      const year = currentDate.getFullYear();
      const res = await axios.get(`${API_URL}/api/staff-schedules?email=${admin.email}&month=${month}&year=${year}`, {
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
  const today = new Date();
  const isToday = (day) => day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();

  const workDays = Object.values(schedules).filter(s => s.shift_type && s.shift_type !== 'szabad').length;
  const freeDays = Object.values(schedules).filter(s => s.shift_type === 'szabad').length;
  const todaySched = schedules[today.getDate()];
  const todayShift = todaySched ? SHIFT_TYPES[todaySched.shift_type] : null;

  const generatePDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const monthName = currentDate.toLocaleString('hu-HU', { month: 'long', year: 'numeric' });
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const now = new Date();
    const docNum = `GVK-${currentDate.getFullYear()}${String(currentDate.getMonth()+1).padStart(2,'0')}-${String(admin?.id || '000').padStart(3,'0')}`;

    // === HEADER ===
    doc.setFillColor(141, 37, 130);
    doc.rect(0, 0, pw, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('BKK FUTÁR', 12, 14);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Forgalomirányítási Központ (GVK)', 12, 21);
    doc.setFontSize(8);
    doc.text('Személyes Műszakbeosztás', 12, 28);
    // Doc number right
    doc.setFontSize(8);
    doc.text(`Iktatószám: ${docNum}`, pw - 12, 14, { align: 'right' });
    doc.text(`Kiállítás: ${now.toLocaleDateString('hu-HU')} ${now.toLocaleTimeString('hu-HU', {hour:'2-digit',minute:'2-digit'})}`, pw - 12, 21, { align: 'right' });
    doc.text(`Érvényesség: ${monthName}`, pw - 12, 28, { align: 'right' });

    // === EMPLOYEE INFO BOX ===
    doc.setFillColor(248, 248, 250);
    doc.rect(8, 39, pw - 16, 20, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(8, 39, pw - 16, 20, 'S');
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Dolgozó adatai', 12, 45);
    doc.setFont('helvetica', 'normal');
    doc.text(`Név: ${admin?.name || '—'}`, 12, 51);
    doc.text(`Beosztás: ${admin?.role || '—'}`, 80, 51);
    doc.text(`Telephely: ${admin?.location || '—'}`, 140, 51);
    doc.text(`E-mail: ${admin?.email || '—'}`, 12, 56);
    doc.text(`Munkanapok: ${workDays}  |  Szabadnapok: ${freeDays}  |  Nyitott: ${daysInMonth - workDays - freeDays}`, 80, 56);

    // === TABLE ===
    const tableData = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const sched = schedules[day];
      const dow = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayName = dow.toLocaleString('hu-HU', { weekday: 'long' });
      
      if (sched) {
        const st = SHIFT_TYPES[sched.shift_type];
        tableData.push([
          `${day}.`,
          dayName,
          st ? st.label : '—',
          sched.shift_type === 'szabad' ? '' : `${sched.shift_start || ''} – ${sched.shift_end || ''}`,
          sched.trip_ids ? sched.trip_ids.join(', ') : '',
          sched.notes || ''
        ]);
      } else {
        tableData.push([`${day}.`, dayName, '—', '', '', '']);
      }
    }

    doc.autoTable({
      startY: 63,
      head: [['Nap', 'Hét napja', 'Műszak típus', 'Időszak', 'Járat beosztás', 'Megjegyzés']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [141, 37, 130], textColor: 255, fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
      bodyStyles: { fontSize: 7, cellPadding: 2.2, textColor: [40, 40, 40] },
      alternateRowStyles: { fillColor: [252, 249, 253] },
      columnStyles: { 0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' }, 1: { cellWidth: 22 }, 2: { cellWidth: 28 }, 3: { cellWidth: 24, halign: 'center' }, 4: { cellWidth: 50 }, 5: { cellWidth: 'auto' } },
      margin: { left: 8, right: 8 }
    });

    // === SIGNATURES ===
    const sigY = doc.lastAutoTable.finalY + 12;
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Készítette:', 12, sigY);
    doc.text('Dolgozó:', pw / 2 + 10, sigY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('GVK Forgalomirányítási Diszpécser', 12, sigY + 5);
    doc.text(`Dátum: ${now.toLocaleDateString('hu-HU')}`, 12, sigY + 10);
    doc.line(12, sigY + 22, 80, sigY + 22);
    doc.text('Aláírás, pecsét', 12, sigY + 26);

    doc.text(`${admin?.name || '—'}`, pw / 2 + 10, sigY + 5);
    doc.text(`${admin?.role || '—'} — ${admin?.location || ''}`, pw / 2 + 10, sigY + 10);
    doc.line(pw / 2 + 10, sigY + 22, pw - 12, sigY + 22);
    doc.text('Dolgozó aláírása', pw / 2 + 10, sigY + 26);

    // === FOOTER ===
    doc.setFillColor(45, 45, 45);
    doc.rect(0, ph - 12, pw, 12, 'F');
    doc.setTextColor(160, 160, 160);
    doc.setFontSize(5.5);
    doc.text('Budapesti Közlekedési Központ Zrt. | 1075 Budapest, Rumbach Sebestyén utca 19-21.', 10, ph - 6);
    doc.text('Jelen dokumentum bizalmasan kezelendő, harmadik félnek nem adható ki.', 10, ph - 3);
    doc.text(`${docNum} | 1/1`, pw - 10, ph - 4, { align: 'right' });

    doc.save(`BKK_Beosztas_${docNum}_${admin?.name?.replace(/\s/g, '_') || 'dolgozo'}.pdf`);
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      {/* --- HEADER BAR --- */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        background: 'linear-gradient(135deg, rgba(141,37,130,0.12), rgba(0,159,227,0.08))',
        padding: '16px 20px', borderRadius: '14px 14px 0 0', 
        borderBottom: '1px solid #333'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(141,37,130,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CalendarIcon size={18} color="#c13db4" />
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700 }}>Beosztásom</div>
            <div style={{ fontSize: '0.7rem', color: '#666' }}>{admin?.name} · {admin?.location || admin?.role}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* View toggle */}
          <div style={{ display: 'flex', background: '#111', borderRadius: '8px', border: '1px solid #333', overflow: 'hidden' }}>
            <button onClick={() => setViewMode('calendar')} style={{ ...toggleBtn, background: viewMode === 'calendar' ? '#8D2582' : 'transparent', color: viewMode === 'calendar' ? 'white' : '#666' }}>
              <Grid size={13} />
            </button>
            <button onClick={() => setViewMode('list')} style={{ ...toggleBtn, background: viewMode === 'list' ? '#8D2582' : 'transparent', color: viewMode === 'list' ? 'white' : '#666' }}>
              <List size={13} />
            </button>
          </div>
          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#111', padding: '4px 10px', borderRadius: '8px', border: '1px solid #333' }}>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()-1, 1))} style={navBtnStyle}><ChevronLeft size={14} /></button>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, minWidth: '85px', textAlign: 'center' }}>
              {currentDate.toLocaleString('hu-HU', { month: 'short', year: 'numeric' })}
            </span>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()+1, 1))} style={navBtnStyle}><ChevronRight size={14} /></button>
          </div>
          {/* PDF */}
          <button onClick={generatePDF} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '8px', background: 'rgba(141,37,130,0.15)', border: '1px solid rgba(141,37,130,0.5)', color: '#c13db4', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
            <Download size={13} /> PDF
          </button>
        </div>
      </div>

      {/* --- TODAY HIGHLIGHT --- */}
      {todaySched && currentDate.getMonth() === today.getMonth() && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '16px',
          background: todayShift ? todayShift.bg : '#1a1a2e',
          padding: '14px 20px',
          borderLeft: `4px solid ${todayShift?.color || '#8D2582'}`,
          borderBottom: '1px solid #333'
        }}>
          <div style={{ fontSize: '1.8rem' }}>{todayShift?.icon || '📋'}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.65rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Mai nap</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: todayShift?.color || 'white' }}>{todayShift?.label || '—'}</div>
            {todaySched.shift_type !== 'szabad' && (
              <div style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '2px' }}>
                <Clock size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                {todaySched.shift_start} – {todaySched.shift_end}
                {todaySched.trip_ids?.length > 0 && <span style={{ marginLeft: '12px' }}>🚌 {todaySched.trip_ids.join(', ')}</span>}
              </div>
            )}
            {todaySched.notes && <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '4px', fontStyle: 'italic' }}>📝 {todaySched.notes}</div>}
          </div>
        </div>
      )}

      {/* --- STATS ROW --- */}
      <div style={{ display: 'flex', borderBottom: '1px solid #333' }}>
        <div style={statCell}>
          <Briefcase size={14} color="#8D2582" />
          <div><div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#8D2582' }}>{workDays}</div><div style={{ fontSize: '0.6rem', color: '#555' }}>MUNKANAP</div></div>
        </div>
        <div style={{ ...statCell, borderLeft: '1px solid #333', borderRight: '1px solid #333' }}>
          <Coffee size={14} color="#fbbf24" />
          <div><div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24' }}>{freeDays}</div><div style={{ fontSize: '0.6rem', color: '#555' }}>SZABAD</div></div>
        </div>
        <div style={statCell}>
          <CalendarIcon size={14} color="#10b981" />
          <div><div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>{daysInMonth - workDays - freeDays}</div><div style={{ fontSize: '0.6rem', color: '#555' }}>NYITOTT</div></div>
        </div>
      </div>

      {/* --- CALENDAR VIEW --- */}
      {viewMode === 'calendar' && (
        <div style={{ background: '#0d0d15', padding: '16px', borderRadius: '0 0 14px 14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '4px' }}>
            {['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'].map(d => (
              <div key={d} style={{ fontSize: '0.6rem', color: '#444', fontWeight: 700, padding: '4px' }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {[...Array(firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1)].map((_, i) => <div key={`e-${i}`} />)}
            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const sched = schedules[day];
              const shift = sched ? SHIFT_TYPES[sched.shift_type] : null;
              return (
                <div key={day} style={{
                  minHeight: '52px', padding: '4px 5px', borderRadius: '8px',
                  background: isToday(day) ? 'rgba(141,37,130,0.2)' : shift ? shift.bg : 'rgba(255,255,255,0.015)',
                  border: isToday(day) ? '2px solid #8D2582' : shift ? `1px solid ${shift.color}25` : '1px solid #1a1a2e',
                  transition: 'all 0.15s'
                }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: isToday(day) ? 800 : 500, color: isToday(day) ? '#c13db4' : '#999' }}>
                    {day}
                  </div>
                  {shift && (
                    <div style={{ marginTop: '2px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.85rem' }}>{shift.icon}</div>
                      {sched.shift_type !== 'szabad' && (
                        <div style={{ fontSize: '0.5rem', color: shift.color, fontWeight: 700, marginTop: '1px' }}>
                          {sched.shift_start}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {Object.entries(SHIFT_TYPES).map(([id, st]) => (
              <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.6rem', color: '#555' }}>
                <span>{st.icon}</span> {st.short}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- LIST VIEW --- */}
      {viewMode === 'list' && (
        <div style={{ background: '#0d0d15', borderRadius: '0 0 14px 14px', maxHeight: '400px', overflowY: 'auto' }}>
          {[...Array(daysInMonth)].map((_, i) => {
            const day = i + 1;
            const sched = schedules[day];
            const shift = sched ? SHIFT_TYPES[sched.shift_type] : null;
            const dow = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dayName = dow.toLocaleString('hu-HU', { weekday: 'short' });
            const isWeekend = dow.getDay() === 0 || dow.getDay() === 6;

            return (
              <div key={day} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 18px',
                borderBottom: '1px solid #1a1a2e',
                background: isToday(day) ? 'rgba(141,37,130,0.08)' : 'transparent'
              }}>
                {/* Day number */}
                <div style={{ 
                  width: 34, height: 34, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  background: isToday(day) ? '#8D2582' : isWeekend ? '#1a1a2e' : '#111',
                  border: isToday(day) ? 'none' : '1px solid #222',
                  fontSize: '0.8rem', fontWeight: 700, color: isToday(day) ? 'white' : isWeekend ? '#555' : '#999'
                }}>
                  {day}
                </div>
                {/* Day name */}
                <div style={{ width: '30px', fontSize: '0.7rem', color: '#555', fontWeight: 600 }}>{dayName}</div>
                {/* Shift info */}
                {shift ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1rem' }}>{shift.icon}</span>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: shift.color }}>{shift.label}</div>
                      {sched.shift_type !== 'szabad' && (
                        <div style={{ fontSize: '0.65rem', color: '#666' }}>
                          {sched.shift_start} – {sched.shift_end}
                          {sched.trip_ids?.length > 0 && ` · ${sched.trip_ids.join(', ')}`}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ flex: 1, fontSize: '0.75rem', color: '#333' }}>—</div>
                )}
                {/* Today badge */}
                {isToday(day) && <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#8D2582', background: 'rgba(141,37,130,0.15)', padding: '2px 8px', borderRadius: '4px' }}>MA</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const navBtnStyle = { background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '2px', display: 'flex' };
const toggleBtn = { border: 'none', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' };
const statCell = { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: '#0d0d15' };
