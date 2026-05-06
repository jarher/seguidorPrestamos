import { create } from 'zustand';
import api from '../services/api';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const response = await api.get('/notifications');
      set({
        notifications: response.data,
        unreadCount: response.data.length,
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
    }
  },

  markAsRead: async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Error al marcar notificación:', error);
    }
  },

  markAllAsRead: async () => {
    const { notifications } = get();
    for (const n of notifications) {
      await get().markAsRead(n.id);
    }
  },
}));

export default useNotificationStore;