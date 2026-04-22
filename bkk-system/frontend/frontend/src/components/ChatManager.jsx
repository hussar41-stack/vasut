import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, User, MessageSquare, Bus, Train, Smartphone, Radio, Search } from 'lucide-react';
import { API_URL } from '../config';

export default function ChatManager() {
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    if (activeContact) {
      fetchThread(activeContact.id);
      const interval = setInterval(() => fetchThread(activeContact.id), 4000);
      return () => clearInterval(interval);
    }
  }, [activeContact]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchContacts = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/chat/contacts`);
      setContacts(res.data);
    } catch (e) {
      console.error('Error fetching contacts:', e);
    }
  };

  const fetchThread = async (partnerId) => {
    try {
      const res = await axios.get(`${API_URL}/api/chat/thread?partner_id=${partnerId}`);
      setMessages(res.data);
    } catch (e) {
      console.error('Error fetching thread:', e);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeContact) return;

    try {
      const res = await axios.post(`${API_URL}/api/chat/messages`, {
        sender: 'GVK Diszpécser',
        sender_id: 'dispatcher',
        recipient_id: String(activeContact.id),
        text: input,
        type: 'outgoing'
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

  const getRoleIcon = (role) => {
    if (!role) return '👤';
    const r = role.toUpperCase();
    if (r.includes('BUSZ')) return '🚌';
    if (r.includes('VILLAMOS')) return '🚃';
    if (r.includes('METRÓ') || r.includes('METRO')) return '🚇';
    if (r.includes('TROLI')) return '🚎';
    if (r.includes('KOORDINÁTOR') || r.includes('KALAUZ')) return '👥';
    return '👤';
  };

  const getRoleColor = (role) => {
    if (!role) return '#666';
    const r = role.toUpperCase();
    if (r.includes('BUSZ')) return '#009fe3';
    if (r.includes('VILLAMOS')) return '#fbbf24';
    if (r.includes('METRÓ') || r.includes('METRO')) return '#ef4444';
    if (r.includes('TROLI')) return '#ef4444';
    return '#8D2582';
  };

  const filteredContacts = contacts.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fade-in" style={{ height: 'calc(100vh - 100px)', display: 'flex', background: '#111', borderRadius: '12px', border: '1px solid #333', overflow: 'hidden' }}>
      {/* Contacts Sidebar */}
      <div style={{ width: '300px', background: '#1a1a1a', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.2rem', borderBottom: '1px solid #333' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#666', letterSpacing: '1px' }}>SZEMÉLYZET</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#111', borderRadius: '6px', padding: '6px 10px', border: '1px solid #333' }}>
            <Search size={14} color="#666" />
            <input 
              type="text" 
              placeholder="Név vagy beosztás..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '0.8rem' }}
            />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {filteredContacts.map(contact => (
            <div 
              key={contact.id}
              onClick={() => setActiveContact(contact)}
              style={{
                padding: '12px',
                borderRadius: '8px',
                cursor: 'pointer',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: activeContact?.id === contact.id ? 'rgba(141, 37, 130, 0.15)' : 'transparent',
                border: activeContact?.id === contact.id ? '1px solid #8D2582' : '1px solid transparent',
              }}
            >
              <div style={{ 
                width: 36, height: 36, borderRadius: '50%', 
                background: getRoleColor(contact.role), 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem', flexShrink: 0
              }}>
                {getRoleIcon(contact.role)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: activeContact?.id === contact.id ? 'white' : '#ccc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {contact.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: getRoleColor(contact.role), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {contact.role} · {contact.location}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {activeContact ? (
          <>
            <header style={{ padding: '1rem 1.5rem', background: '#1a1a1a', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: 32, height: 32, borderRadius: '50%', 
                background: getRoleColor(activeContact.role), 
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem'
              }}>
                {getRoleIcon(activeContact.role)}
              </div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'white' }}>{activeContact.name}</div>
                <div style={{ fontSize: '0.7rem', color: getRoleColor(activeContact.role) }}>{activeContact.role} · {activeContact.location}</div>
              </div>
            </header>

            <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', background: '#0e0e0e' }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#333', fontSize: '0.85rem', marginTop: '3rem' }}>
                  Még nincs üzenetváltás. Írj {activeContact.name} részére!
                </div>
              ) : (
                messages.map(msg => {
                  const isDispatcher = msg.type === 'outgoing';
                  return (
                    <div key={msg.id} style={{
                      alignSelf: isDispatcher ? 'flex-end' : 'flex-start',
                      maxWidth: '70%',
                      background: isDispatcher ? 'rgba(141, 37, 130, 0.1)' : '#1a1a1a',
                      padding: '10px 14px', borderRadius: '10px',
                      border: isDispatcher ? '1px solid #8D2582' : '1px solid #333'
                    }}>
                      <div style={{ fontSize: '0.65rem', color: isDispatcher ? '#c13db4' : '#666', marginBottom: '3px', display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                        <span style={{ fontWeight: 'bold' }}>{msg.sender}</span>
                        <span>{formatTime(msg.created_at)}</span>
                      </div>
                      <div style={{ color: 'white', fontSize: '0.9rem' }}>{msg.text}</div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSend} style={{ padding: '1rem 1.5rem', background: '#1a1a1a', borderTop: '1px solid #333', display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                placeholder={`Üzenet ${activeContact.name} részére...`}
                value={input}
                onChange={e => setInput(e.target.value)}
                style={{ flex: 1, background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '10px 14px', color: 'white', outline: 'none', fontSize: '0.9rem' }}
              />
              <button type="submit" style={{ background: '#8D2582', border: 'none', borderRadius: '8px', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Send size={18} color="white" />
              </button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '15px', color: '#333' }}>
            <MessageSquare size={48} />
            <div style={{ fontSize: '1rem' }}>Válassz egy személyt a bal oldali listából</div>
            <div style={{ fontSize: '0.8rem', color: '#444' }}>A kommunikáció biztonságosan naplózva van</div>
          </div>
        )}
      </div>
    </div>
  );
}
