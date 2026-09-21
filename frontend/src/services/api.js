const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

function getToken() {
  return localStorage.getItem('typing_token');
}

function headers(extra = {}) {
  return {
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function request(path, options = {}) {
  const token = getToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(token && !options.skipAuth ? { Authorization: `Bearer ${token}` } : {}),
      ...headers(),
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(typeof data === 'string' ? data : data.message || 'Request failed.');
  }

  return data;
}

export const authApi = {
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request('/auth/me', { skipAuth: false }),
};

export const leaderboardApi = {
  list: (page = 1, limit = 10) => request(`/leaderboard?page=${page}&limit=${limit}`),
  current: () => request('/leaderboard/me'),
};

export const resultApi = {
  save: (payload) => request('/tests/result', { method: 'POST', body: JSON.stringify(payload) }),
  best: () => request('/users/me/best'),
};
