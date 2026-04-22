import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Download, Clock } from 'lucide-react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { API_URL } from '../config';
import { useAdminAuth } from '../contexts/AdminAuthContext';

const SHIFT_TYPES = [
  { id: 'reggeli', label: 'Reggeli', color: '#fbbf24' },
  { id: 'delutani', label: 'Délutáni', color: '#009fe3' },
  { id: 'ejszakai', label: 'Éjszakai', color: '#8D2582' },
  { id: 'osztatlan', label: 'Osztatlan', color: '#ef4444' },
  { id: 'szabad', label: 'Szabad', color: '#333' },
];

export default function MyScheduleView() {
  const { admin } = useAdminAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState({});

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

  const getShiftInfo = (day) => {
    const sched = schedules[day];
    if (!sched) return null;
    return SHIFT_TYPES.find(s => s.id === sched.shift_type) || SHIFT_TYPES[0];
  };

  // Count stats
  const totalDays = Object.keys(schedules).length;
  const workDays = Object.values(schedules).filter(s => s.shift_type !== 'szabad').length;
  const freeDays = Object.values(schedules).filter(s => s.shift_type === 'szabad').length;

  const generatePDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const monthName = currentDate.toLocaleString('hu-HU', { month: 'long', year: 'numeric' });
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();

    // Header
    doc.setFillColor(141, 37, 130);
    doc.rect(0, 0, pw, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('BKK FUTÁR | Személyes Műszakbeosztás', 15, 13);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`${monthName} — ${admin?.name || ''}`, 15, 21);
    doc.text(`Letöltve: ${new Date().toLocaleString('hu-HU')}`, pw - 15, 21, { align: 'right' });

    // Info bar
    doc.setFillColor(240, 240, 240);
    doc.rect(0, 28, pw, 10, 'F');
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(8);
    doc.text(`Telephely: ${admin?.location || '—'}  |  Beosztott napok: ${totalDays}  |  Munkanapok: ${workDays}  |  Szabadnapok: ${freeDays}`, 15, 34);

    // Table
    const tableData = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const sched = schedules[day];
      const dayOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayName = dayOfWeek.toLocaleString('hu-HU', { weekday: 'long' });
      
      if (sched) {
        const st = SHIFT_TYPES.find(s => s.id === sched.shift_type);
        tableData.push([
          `${day}.`,
          dayName,
          st ? st.label : '—',
          sched.shift_type === 'szabad' ? '—' : `${sched.shift_start || ''} — ${sched.shift_end || ''}`,
          sched.trip_ids ? sched.trip_ids.join(', ') : '—',
          sched.notes || ''
        ]);
      } else {
        tableData.push([`${day}.`, dayName, '—', '—', '—', '']);
      }
    }

    doc.autoTable({
      startY: 42,
      head: [['Nap', 'Hét napja', 'Műszak', 'Időszak', 'Járat', 'Megjegyzés']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [141, 37, 130], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: [30, 30, 30], cellPadding: 2.5 },
      alternateRowStyles: { fillColor: [250, 245, 252] },
      columnStyles: {
        0: { cellWidth: 12, fontStyle: 'bold', halign: 'center' },
        1: { cellWidth: 25 },
        2: { cellWidth: 22 },
        3: { cellWidth: 28, halign: 'center' },
        4: { cellWidth: 55 },
        5: { cellWidth: 'auto' }
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 2) {
          const type = data.cell.raw;
          if (type === 'Reggeli') data.cell.styles.textColor = [180, 130, 0];
          if (type === 'Délutáni') data.cell.styles.textColor = [0, 120, 200];
          if (type === 'Éjszakai') data.cell.styles.textColor = [141, 37, 130];
          if (type === 'Osztatlan') data.cell.styles.textColor = [200, 50, 50];
          if (type === 'Szabad') {
            data.cell.styles.textColor = [150, 150, 150];
            data.row.cells[3].styles.textColor = [200, 200, 200];
          }
        }
      },
      margin: { left: 10, right: 10 }
    });

    // Footer
    doc.setFillColor(50, 50, 50);
    doc.rect(0, ph - 8, pw, 8, 'F');
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(6.5);
    doc.text('BKK FUTÁR GVK — Ez a dokumentum a munkavállalónak készült személyes beosztás.', 10, ph - 3);

    doc.save(`Beosztas_${admin?.name?.replace(/\s/g, '_') || 'sofor'}_${monthName.replace(/\s/g, '_')}.pdf`);
  };

  return (
    <div style={{ marginTop: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarIcon size={18} color="#8D2582" /> Saját Beosztásom
        </h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#1a1a2e', padding: '4px 12px', borderRadius: '6px', border: '1px solid #333' }}>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()-1, 1))} style={navBtn}><ChevronLeft size={14} /></button>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, minWidth: '100px', textAlign: 'center' }}>
              {currentDate.toLocaleString('hu-HU', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()+1, 1))} style={navBtn}><ChevronRight size={14} /></button>
          </div>
          <button onClick={generatePDF} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '6px', background: 'rgba(141,37,130,0.15)', border: '1px solid #8D2582', color: '#c13db4', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
            <Download size={13} /> PDF
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
        <div style={statBox}><span style={{ color: '#666', fontSize: '0.65rem' }}>BEOSZTVA</span><span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#8D2582' }}>{totalDays}</span></div>
        <div style={statBox}><span style={{ color: '#666', fontSize: '0.65rem' }}>MUNKANAP</span><span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#10b981' }}>{workDays}</span></div>
        <div style={statBox}><span style={{ color: '#666', fontSize: '0.65rem' }}>SZABAD</span><span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fbbf24' }}>{freeDays}</span></div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
        {SHIFT_TYPES.map(st => (
          <div key={st.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', color: '#666' }}>
            <div style={{ width: 8, height: 8, borderRadius: '2px', background: st.color }} /> {st.label}
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div style={{ background: '#1a1a2e', borderRadius: '10px', border: '1px solid #333', padding: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center', marginBottom: '6px' }}>
          {['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'].map(d => (
            <div key={d} style={{ fontSize: '0.65rem', color: '#555', fontWeight: 'bold' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
          {[...Array(firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1)].map((_, i) => <div key={`e-${i}`} />)}
          {[...Array(daysInMonth)].map((_, i) => {
            const day = i + 1;
            const sched = schedules[day];
            const shift = getShiftInfo(day);
            return (
              <div key={day} style={{
                minHeight: '55px', padding: '5px', borderRadius: '6px',
                background: shift ? shift.color + '15' : 'rgba(255,255,255,0.02)',
                border: isToday(day) ? '2px solid #8D2582' : shift ? `1px solid ${shift.color}40` : '1px solid #222'
              }}>
                <div style={{ fontSize: '0.7rem', fontWeight: isToday(day) ? 'bold' : '500', color: isToday(day) ? '#8D2582' : '#ccc', marginBottom: '2px' }}>
                  {day}{isToday(day) && <span style={{ fontSize: '0.5rem', marginLeft: '2px' }}>MA</span>}
                </div>
                {sched && shift && (
                  <div style={{ fontSize: '0.55rem' }}>
                    <div style={{ color: shift.color, fontWeight: 600 }}>
                      {shift.id === 'szabad' ? '🏖' : `${sched.shift_start}-${sched.shift_end}`}
                    </div>
                    {sched.trip_ids && sched.trip_ids.length > 0 && (
                      <div style={{ color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sched.trip_ids[0]}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's detail */}
      {schedules[today.getDate()] && currentDate.getMonth() === today.getMonth() && (
        <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(141,37,130,0.1)', borderRadius: '8px', border: '1px solid rgba(141,37,130,0.3)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#c13db4', marginBottom: '6px' }}>📋 MAI BEOSZTÁSOD</div>
          <div style={{ fontSize: '0.85rem' }}>
            <b>{SHIFT_TYPES.find(s => s.id === schedules[today.getDate()].shift_type)?.label || '—'}</b>
            {schedules[today.getDate()].shift_type !== 'szabad' && (
              <span style={{ color: '#888' }}> · {schedules[today.getDate()].shift_start} — {schedules[today.getDate()].shift_end}</span>
            )}
          </div>
          {schedules[today.getDate()].trip_ids?.length > 0 && (
            <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '4px' }}>Járat: {schedules[today.getDate()].trip_ids.join(', ')}</div>
          )}
          {schedules[today.getDate()].notes && (
            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px', fontStyle: 'italic' }}>{schedules[today.getDate()].notes}</div>
          )}
        </div>
      )}
    </div>
  );
}

const navBtn = { background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '2px' };
const statBox = { flex: 1, padding: '8px', background: '#111', borderRadius: '8px', border: '1px solid #222', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' };
