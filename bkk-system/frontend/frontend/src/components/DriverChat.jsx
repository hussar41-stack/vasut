import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, MessageSquare, WifiOff } from 'lucide-react';
import { API_URL } from '../config';
import { useAdminAuth } from '../contexts/AdminAuthContext';

/**
 * DriverChat - Járművezetői chat a GVK diszpécserrel
 * A bejelentkezett sofőr ID-ja alapján szűr: csak a saját beszélgetését látja
 */
export default function DriverChat() {
  const { admin } = useAdminAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef(null);

  const myId = admin?.id?.toString() || admin?.email || '';
  const myName = admin?.name || 'Járművezető';

  useEffect(() => {
    if (!myId) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [myId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/chat/thread?partner_id=${myId}`);
      setMessages(res.data);
      setConnected(true);
    } catch (e) {
      setConnected(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      const res = await axios.post(`${API_URL}/api/chat/messages`, {
        sender: myName,
        sender_id: myId,
        recipient_id: 'dispatcher',
        text: input,
        type: 'incoming'
      });
      setMessages(prev => [...prev, res.data]);
      setInput('');
    } catch (e) {
      alert('Hiba az üzenet küldésekor!');
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '420px', background: '#0a0a0a',
      borderRadius: '12px', border: '1px solid #333', overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', background: '#1a1a1a',
        borderBottom: '1px solid #333',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={16} color="#8D2582" />
          <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>GVK Diszpécser</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem' }}>
          {connected ? (
            <>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981' }} />
              <span style={{ color: '#10b981' }}>KAPCSOLÓDVA</span>
            </>
          ) : (
            <>
              <WifiOff size={12} color="#ef4444" />
              <span style={{ color: '#ef4444' }}>NINCS KAPCSOLAT</span>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '12px',
        display: 'flex', flexDirection: 'column', gap: '8px'
      }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#444', marginTop: '2rem', fontSize: '0.85rem' }}>
            Nincs üzenet. Jelezz a diszpécsernek, ha segítségre van szükséged!
          </div>
        ) : messages.map(msg => {
          const isOwn = msg.sender_id === myId;
          return (
            <div key={msg.id} style={{
              alignSelf: isOwn ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              background: isOwn ? 'rgba(141, 37, 130, 0.15)' : '#1a1a1a',
              padding: '8px 12px', borderRadius: '10px',
              border: isOwn ? '1px solid rgba(141,37,130,0.4)' : '1px solid #333'
            }}>
              <div style={{ fontSize: '0.65rem', color: isOwn ? '#c13db4' : '#10b981', marginBottom: '3px' }}>
                {isOwn ? 'Te' : 'GVK Diszpécser'} · {formatTime(msg.created_at)}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'white' }}>{msg.text}</div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={{
        padding: '10px', background: '#111',
        borderTop: '1px solid #333',
        display: 'flex', gap: '8px'
      }}>
        <input
          type="text"
          placeholder="Üzenet a GVK felé..."
          value={input}
          onChange={e => setInput(e.target.value)}
          style={{
            flex: 1, background: '#0a0a0a', border: '1px solid #333',
            borderRadius: '6px', padding: '8px 12px', color: 'white', outline: 'none',
            fontSize: '0.85rem'
          }}
        />
        <button type="submit" style={{
          background: '#8D2582', border: 'none', borderRadius: '6px',
          width: '36px', height: '36px', display: 'flex',
          alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
        }}>
          <Send size={16} color="white" />
        </button>
      </form>
    </div>
  );
}
