import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set, get) => ({
  user: null,
  token: sessionStorage.getItem('token'),
  isAuthenticated: !!sessionStorage.getItem('token'),

  login: async (email, password) => {
    const response = await api.post('/auth/login', { userEmail: email, userPassword: password });
    const { token, user } = response.data;
    sessionStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
    return user;
  },

  register: async (data) => {
    const response = await api.post('/auth/register', data);
    const { token, user } = response.data;
    sessionStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
    return user;
  },

  logout: () => {
    sessionStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  deleteAccount: async () => {
    await api.delete('/auth/account');
    sessionStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

export default useAuthStore;