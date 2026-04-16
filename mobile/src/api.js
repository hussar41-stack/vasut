import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://vasut.onrender.com/api'; // Production Backend

async function getToken() {
  return await AsyncStorage.getItem('token');
}

async function request(path, options = {}) {
  const token = await getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  
  try {
    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Szerver hiba');
    return data;
  } catch (e) {
    console.error(`API Error (${path}):`, e);
    throw e;
  }
}

export const api = {
  getNews: () => request('/news'),
  search: (params) => request('/search', { method: 'POST', body: JSON.stringify(params) }),
};
