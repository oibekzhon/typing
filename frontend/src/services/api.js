const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const STORAGE_KEY = 'typing_token';

function getToken() {
  return localStorage.getItem(STORAGE_KEY);
}

async function request(path, { skipAuth, ...options } = {}) {
  const token = getToken();
  const sendToken = Boolean(token) && !skipAuth;

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(sendToken ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

  // A token the server rejects will be rejected by every later call too, so it
  // goes now and the app hears about it once. Without this the header keeps
  // showing a user who is no longer logged in. skipAuth keeps a failed login
  // attempt from wiping the session of whoever is already signed in.
  if (response.status === 401 && sendToken) {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event('auth:expired'));
  }

  if (!response.ok) {
    throw new Error(typeof data === 'string' ? data : data.message || 'Request failed.');
  }

  return data;
}

export const authApi = {
  register: (payload) => request('/auth/register', { method: 'POST', skipAuth: true, body: JSON.stringify(payload) }),
  login: (payload) => request('/auth/login', { method: 'POST', skipAuth: true, body: JSON.stringify(payload) }),
  me: () => request('/auth/me'),
};

export const leaderboardApi = {
  list: (page = 1, limit = 10) => request(`/leaderboard?page=${page}&limit=${limit}`),
  current: () => request('/leaderboard/me'),
};

export const resultApi = {
  save: (payload) => request('/tests/result', { method: 'POST', body: JSON.stringify(payload) }),
  best: () => request('/users/me/best'),
};
