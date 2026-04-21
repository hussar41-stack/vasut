import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("GVK System Error Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: 'white',
          fontFamily: 'Inter, system-ui, sans-serif', padding: '20px', textAlign: 'center'
        }}>
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444',
            padding: '2rem', borderRadius: '20px', maxWidth: '500px', boxShadow: '0 0 30px rgba(239, 68, 68, 0.2)'
          }}>
            <AlertCircle size={60} color="#ef4444" style={{ marginBottom: '1rem' }} />
            <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Rendszer Hiba Történt</h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '2rem' }}>
              Sajnáljuk, a felület váratlan hibába ütközött. <br/>
              Kód: <code style={{ color: '#f87171' }}>{this.state.error?.message || "Unknown Runtime Error"}</code>
            </p>
            
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none',
                  borderRadius: '10px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                <RefreshCw size={18} /> ÚJRATÖLTÉS
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                style={{
                  padding: '10px 20px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none',
                  borderRadius: '10px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                <Home size={18} /> KEZDŐLAP
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
