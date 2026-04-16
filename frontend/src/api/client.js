const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
  } catch {
    throw new Error('Nem sikerült csatlakozni a szerverhez. Ellenőrizd, hogy a backend fut-e (port 5000).');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `API hiba (${res.status})`);
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
