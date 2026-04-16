let envUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').trim();
// Normalize url so if user forgot /api in Vercel, we add it back safely
if (envUrl.endsWith('/')) envUrl = envUrl.slice(0, -1);
if (!envUrl.endsWith('/api')) envUrl += '/api';
const BASE_URL = envUrl;

function getToken() { return localStorage.getItem('token'); }

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch (e) {
    throw new Error(`Szerver hiba (fetch failed). Cél: ${BASE_URL}${path}. Részletek: ${e.message}`);
  }
  let data;
  try {
    data = await res.json();
  } catch(e) {
    throw new Error(`Érvénytelen válasz a szervertől (nem JSON). Cél: ${BASE_URL}${path}`);
  }
  if (!res.ok) throw new Error(`${data.error || 'Ismeretlen hiba'} (URL: ${BASE_URL}${path})`);
  return data;
}

export const api = {
  health: () => request('/health'),

  // Auth
  register: ({ name, email, password }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  login: ({ email, password }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getProfile: () => request('/auth/me'),
  forgotPassword: (email) =>
    request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token, newPassword) =>
    request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) }),

  // Schedule search
  search: ({ from, to, date }) =>
    request('/search', { method: 'POST', body: JSON.stringify({ from, to, date }) }),

  // Delay update
  updateDelay: (tripId, delayMinutes) =>
    request(`/trips/${tripId}/delay`, { method: 'PATCH', body: JSON.stringify({ delayMinutes }) }),

  // Tickets
  purchaseTicket: ({ tripId, tripData, passengerName, seatClass, quantity }) =>
    request('/tickets', {
      method: 'POST',
      body: JSON.stringify({ tripId, tripData, passengerName, seatClass, quantity }),
    }),
  createCheckoutSession: ({ tripId, tripData, passengerName, seatClass, quantity }) =>
    request('/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ tripId, tripData, passengerName, seatClass, quantity }),
    }),
  getMyTickets: (email) =>
    request(`/tickets${email ? `?email=${encodeURIComponent(email)}` : ''}`),
};
