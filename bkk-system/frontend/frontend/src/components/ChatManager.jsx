import React, { useState, useEffect } from 'react';
import { Send, User, MessageSquare, Clock, Bus, Train, Smartphone, Users, Radio } from 'lucide-react';

export default function ChatManager() {
  const [activeChannel, setActiveChannel] = useState('global');
  const [channels, setChannels] = useState([
    { id: 'global', name: '📢 Központi Csatorna', color: '#8D2582', icon: <Radio size={18}/>, unread: 0 },
    { id: 'bus', name: '🚌 Autóbusz Ágazat', color: '#009fe3', icon: <Bus size={18}/>, unread: 2 },
    { id: 'tram', name: '🚃 Villamos Ágazat', color: '#fbbf24', icon: <Train size={18}/>, unread: 1 },
    { id: 'metro', name: '🚇 Metró Üzemegység', color: '#ef4444', icon: <Smartphone size={18}/>, unread: 0 },
  ]);

  const [messages, setMessages] = useState({
    global: [
      { id: 1, sender: 'Szerver', text: 'Műszakváltás sikeres. Jó munkát!', time: '14:00', type: 'system' }
    ],
    bus: [
      { id: 101, sender: 'Kovács János (7-es busz)', text: 'BPI-007: Forgalmi akadály a Blaha Lujza térnél.', time: '16:45', type: 'incoming' }
    ],
    tram: [
      { id: 201, sender: 'Szabó Mária (4-6 villamos)', text: '#2014: Műszaki hiba a fékrendszerben a Corvin-negyednél.', time: '17:02', type: 'incoming' }
    ],
    metro: []
  });

  const [input, setInput] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const newMessage = {
      id: Date.now(),
      sender: 'GVK Diszpécser',
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'outgoing'
    };
    
    setMessages({
      ...messages,
      [activeChannel]: [...(messages[activeChannel] || []), newMessage]
    });
    setInput('');
  };

  return (
    <div className="fade-in" style={{ height: 'calc(100vh - 160px)', display: 'flex', background: '#111', borderRadius: '12px', border: '1px solid #333', overflow: 'hidden' }}>
      {/* Channels Sidebar */}
      <div style={{ width: '280px', background: '#1a1a1a', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #333' }}>
          <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#666', letterSpacing: '1px' }}>CSATORNÁK</h3>
        </div>
        <div style={{ flex: 1, padding: '10px' }}>
          {channels.map(ch => (
            <div 
              key={ch.id}
              onClick={() => setActiveChannel(ch.id)}
              style={{
                padding: '12px 15px',
                borderRadius: '8px',
                cursor: 'pointer',
                marginBottom: '5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: activeChannel === ch.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                border: activeChannel === ch.id ? `1px solid ${ch.color}` : '1px solid transparent',
                color: activeChannel === ch.id ? 'white' : '#888'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: ch.color }}>{ch.icon}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: activeChannel === ch.id ? 600 : 400 }}>{ch.name.replace(/[^\w\sÁÉÍÓÖŐÚÜŰáéíóöőúüű]/g, '')}</span>
              </div>
              {ch.unread > 0 && activeChannel !== ch.id && (
                <div style={{ background: '#ef4444', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>{ch.unread}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ padding: '1.2rem 1.5rem', background: '#1a1a1a', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'white' }}>{channels.find(c => c.id === activeChannel)?.name}</h2>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#666' }}>ID: CH-{activeChannel.toUpperCase()}</div>
        </header>

        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#0e0e0e' }}>
          {(messages[activeChannel] || []).length === 0 ? (
             <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: '0.9rem', fontStyle: 'italic' }}>
               Nincs üzenet ebben a csatornában.
             </div>
          ) : (
            (messages[activeChannel] || []).map(msg => (
              <div key={msg.id} style={{ 
                alignSelf: msg.type === 'outgoing' ? 'flex-end' : 'flex-start',
                maxWidth: '70%',
                background: msg.type === 'outgoing' ? 'rgba(141, 37, 130, 0.1)' : '#1a1a1a',
                padding: '12px 16px',
                borderRadius: '12px',
                border: msg.type === 'outgoing' ? '1px solid #8D2582' : '1px solid #333'
              }}>
                <div style={{ fontSize: '0.7rem', color: msg.type === 'outgoing' ? '#c13db4' : '#666', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 'bold' }}>{msg.sender}</span>
                  <span style={{ marginLeft: '10px' }}>{msg.time}</span>
                </div>
                <div style={{ color: 'white', fontSize: '0.9rem' }}>{msg.text}</div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSend} style={{ padding: '1.5rem', background: '#1a1a1a', borderTop: '1px solid #333', display: 'flex', gap: '12px' }}>
          <input 
            type="text" 
            placeholder={`Üzenet a ${channels.find(c => c.id === activeChannel)?.name} részére...`}
            value={input}
            onChange={e => setInput(e.target.value)}
            style={{ flex: 1, background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '12px', color: 'white', outline: 'none' }}
          />
          <button type="submit" style={{ background: '#8D2582', border: 'none', borderRadius: '8px', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
