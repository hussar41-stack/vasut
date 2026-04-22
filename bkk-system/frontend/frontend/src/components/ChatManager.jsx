import React, { useState, useEffect } from 'react';
import { Send, User, MessageSquare, Clock } from 'lucide-react';

export default function ChatManager() {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'Kovács János (Buszsofőr)', text: '7-es busz, BPI-007: Forgalmi akadály a Blaha Lujza térnél.', time: '16:45', type: 'incoming' },
    { id: 2, sender: 'Diszpécser', text: 'Vettem, küldöm a koordinátorokat.', time: '16:47', type: 'outgoing' },
    { id: 3, sender: 'Szabó Mária (Villamosvezető)', text: '4-6 villamos, #2014: Műszaki hiba a fékrendszerben.', time: '17:02', type: 'incoming' },
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const newMessage = {
      id: Date.now(),
      sender: 'Diszpécser',
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'outgoing'
    };
    
    setMessages([...messages, newMessage]);
    setInput('');
  };

  return (
    <div className="fade-in" style={{ height: 'calc(100vh - 150px)', display: 'flex', flexDirection: 'column', background: '#111', borderRadius: '12px', border: '1px solid #333', overflow: 'hidden' }}>
      <header style={{ padding: '1.5rem', background: '#1a1a1a', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <MessageSquare color="#8D2582" />
        <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'white' }}>Operatív Chat (Járművezetői kommunikáció)</h2>
      </header>

      <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ 
            alignSelf: msg.type === 'incoming' ? 'flex-start' : 'flex-end',
            maxWidth: '70%',
            background: msg.type === 'incoming' ? '#222' : 'rgba(141, 37, 130, 0.2)',
            padding: '12px 16px',
            borderRadius: '12px',
            border: msg.type === 'incoming' ? '1px solid #333' : '1px solid #8D2582'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: msg.type === 'incoming' ? '#8D2582' : '#c13db4', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
              <span>{msg.sender}</span>
              <span style={{ fontWeight: 'normal', color: '#666', marginLeft: '10px' }}>{msg.time}</span>
            </div>
            <div style={{ color: 'white', fontSize: '0.95rem', lineHeight: '1.4' }}>{msg.text}</div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} style={{ padding: '1.5rem', background: '#1a1a1a', borderTop: '1px solid #333', display: 'flex', gap: '12px' }}>
        <input 
          type="text" 
          placeholder="Üzenet küldése a járművezetőknek..." 
          value={input}
          onChange={e => setInput(e.target.value)}
          style={{ flex: 1, background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '12px', color: 'white', outline: 'none' }}
        />
        <button type="submit" style={{ background: '#8D2582', border: 'none', borderRadius: '8px', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
