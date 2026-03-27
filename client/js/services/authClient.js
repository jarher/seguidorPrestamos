import { apiRequest } from './apiClient.js';

const ACCESS_KEY = 'lender_access_token';
const REFRESH_KEY = 'lender_refresh_token';
const USER_KEY = 'lender_user';

export function getSession() {
  const token = localStorage.getItem(ACCESS_KEY);
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  const user = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  return { token, refreshToken, user };
}

export function setSession({ token, refreshToken, user }) {
  if (token) localStorage.setItem(ACCESS_KEY, token);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function register({ email, password, fullName }) {
  const data = await apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, fullName }),
  });

  setSession({ token: data.token, refreshToken: data.refreshToken, user: data.user });
  return data;
}

export async function login({ email, password }) {
  const data = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  setSession({ token: data.token, refreshToken: data.refreshToken, user: data.user });
  return data;
}

export async function logout() {
  const session = getSession();
  try {
    await apiRequest('/api/auth/logout', { 
      method: 'POST', 
      body: JSON.stringify({ refreshToken: session.refreshToken }) 
    });
  } catch {
    // ignore
  } finally {
    clearSession();
  }
}

