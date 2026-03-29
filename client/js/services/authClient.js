import { apiRequest } from './apiClient.js';

const SESSION_KEY = 'lender_session';

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) || { token: null, user: null };
  } catch {
    return { token: null, user: null };
  }
}

export function setSession({ token, user }) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token, user }));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export async function register({ email, password, fullName }) {
  const data = await apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, fullName }),
  });

  setSession({ token: data.token, user: data.user });
  return data;
}

export async function login({ email, password }) {
  const data = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  setSession({ token: data.token, user: data.user });
  return data;
}

export async function logout() {
  try {
    await apiRequest('/api/auth/logout', { method: 'POST' });
  } catch {
    // ignore
  } finally {
    clearSession();
  }
}
