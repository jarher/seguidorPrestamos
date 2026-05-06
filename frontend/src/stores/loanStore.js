import { create } from 'zustand';
import api from '../services/api';

const useLoanStore = create((set, get) => ({
  loans: [],
  currentLoan: null,
  currentSchedule: [],
  loading: false,
  error: null,

  fetchLoans: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/loans${params ? `?${params}` : ''}`);
      set({ loans: response.data, loading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error al obtener préstamos', loading: false });
    }
  },

  fetchLoanById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/loans/${id}`);
      set({
        currentLoan: response.data.loan,
        currentSchedule: response.data.schedule,
        loading: false,
      });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error al obtener préstamo', loading: false });
    }
  },

  createLoan: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/loans', data);
      set((state) => ({
        loans: [...state.loans, response.data.loan],
        currentLoan: response.data.loan,
        currentSchedule: response.data.schedule,
        loading: false,
      }));
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error al crear préstamo', loading: false });
      throw error;
    }
  },

  markInstallmentPaid: async (loanId, installmentNumber) => {
    set({ loading: true, error: null });
    try {
      const response = await api.patch(`/loans/${loanId}/installments/${installmentNumber}/pay`);
      const { loanStatus } = response.data;
      set((state) => ({
        currentSchedule: state.currentSchedule.map((inst) =>
          inst.installmentNumber === parseInt(installmentNumber)
            ? { ...inst, isPaid: true, paidAt: response.data.installment.paidAt }
            : inst
        ),
        currentLoan: state.currentLoan
          ? { ...state.currentLoan, status: loanStatus }
          : null,
        loading: false,
      }));
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error al marcar cuota', loading: false });
      throw error;
    }
  },

  updateLoanStatus: async (id, status) => {
    set({ loading: true, error: null });
    try {
      const response = await api.patch(`/loans/${id}/status`, { status });
      set((state) => ({
        loans: state.loans.map((loan) =>
          loan.id === id ? { ...loan, status: response.data.status } : loan
        ),
        currentLoan: state.currentLoan?.id === id
          ? { ...state.currentLoan, status: response.data.status, statusUpdatedAt: response.data.statusUpdatedAt }
          : state.currentLoan,
        loading: false,
      }));
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error al actualizar estado', loading: false });
      throw error;
    }
  },

  deleteLoan: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/loans/${id}`);
      set((state) => ({
        loans: state.loans.filter((loan) => loan.id !== id),
        loading: false,
      }));
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error al eliminar préstamo', loading: false });
      throw error;
    }
  },

  clearCurrentLoan: () => set({ currentLoan: null, currentSchedule: [] }),
}));

export default useLoanStore;