const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
  } catch (networkErr) {
    throw new Error(
      'Nem sikerült csatlakozni a szerverhez. ' +
      'Ellenőrizd, hogy a backend fut-e (node server.js a backend mappában, port 5000).'
    );
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `API hiba (${res.status})`);
  return data;
}

export const api = {
  // Health check
  health: () => request('/health'),

  // Stops (legacy)
  getStops: (q) => request(`/stops${q ? `?q=${encodeURIComponent(q)}` : ''}`),

  // New unified search: POST /api/search
  search: ({ from, to, date }) =>
    request('/search', {
      method: 'POST',
      body: JSON.stringify({ from, to, date }),
    }),

  // Delay update: PATCH /api/trips/:id/delay
  updateDelay: (tripId, delayMinutes) =>
    request(`/trips/${tripId}/delay`, {
      method: 'PATCH',
      body: JSON.stringify({ delayMinutes }),
    }),

  // Tickets
  purchaseTicket: ({ tripId, tripData, passengerName, passengerEmail, seatClass, quantity }) =>
    request('/tickets', {
      method: 'POST',
      body: JSON.stringify({ tripId, tripData, passengerName, passengerEmail, seatClass, quantity }),
    }),

  getMyTickets: (email) =>
    request(`/tickets?email=${encodeURIComponent(email)}`),
};
