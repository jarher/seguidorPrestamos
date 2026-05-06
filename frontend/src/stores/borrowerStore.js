import { create } from 'zustand';
import api from '../services/api';

const useBorrowerStore = create((set, get) => ({
  borrowers: [],
  currentBorrower: null,
  loading: false,
  error: null,

  fetchBorrowers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/borrowers');
      set({ borrowers: response.data, loading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error al obtener prestatarios', loading: false });
    }
  },

  fetchBorrowerById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/borrowers/${id}`);
      set({ currentBorrower: response.data, loading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error al obtener prestatario', loading: false });
    }
  },

  createBorrower: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/borrowers', data);
      set((state) => ({
        borrowers: [...state.borrowers, response.data],
        loading: false,
      }));
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error al crear prestatario', loading: false });
      throw error;
    }
  },

  updateBorrower: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/borrowers/${id}`, data);
      set((state) => ({
        borrowers: state.borrowers.map((b) => (b.id === id ? response.data : b)),
        currentBorrower: state.currentBorrower?.id === id ? response.data : state.currentBorrower,
        loading: false,
      }));
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error al actualizar prestatario', loading: false });
      throw error;
    }
  },

  deleteBorrower: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/borrowers/${id}`);
      set((state) => ({
        borrowers: state.borrowers.filter((b) => b.id !== id),
        loading: false,
      }));
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error al eliminar prestatario', loading: false });
      throw error;
    }
  },

  clearCurrentBorrower: () => set({ currentBorrower: null }),
}));

export default useBorrowerStore;