import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// ResizeObserver hiba elnyomása (lokális fejlesztői környezetben gyakori, ártalmatlan React hiba)
window.addEventListener('error', e => {
  if (e.message === 'ResizeObserver loop completed with undelivered notifications.' || e.message === 'ResizeObserver loop limit exceeded') {
    e.stopImmediatePropagation();
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
