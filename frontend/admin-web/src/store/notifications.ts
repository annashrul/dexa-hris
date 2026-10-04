import { create } from 'zustand';
import { getSocket } from '../lib/socket';

export interface NotificationPayload {
  id?: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  data?: unknown;
  timestamp: string | number | Date;
}

interface NotificationsState {
  items: NotificationPayload[];
  unreadCount: number;
  snackbar: { open: boolean; payload: NotificationPayload | null };
  push: (payload: NotificationPayload) => void;
  markAllRead: () => void;
  clearAll: () => void;
  closeSnackbar: () => void;
  setupSocketListener: () => () => void;
}

const MAX_ITEMS = 50;

export const useNotifications = create<NotificationsState>((set, get) => ({
  items: [],
  unreadCount: 0,
  snackbar: { open: false, payload: null },

  push: (payload) => {
    const withId: NotificationPayload = {
      ...payload,
      id: payload.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: payload.timestamp ?? new Date().toISOString(),
    };
    // eslint-disable-next-line no-console
    console.log('[Notifications] push received:', withId);
    set((state) => {
      const next = [withId, ...state.items].slice(0, MAX_ITEMS);
      return {
        items: next,
        unreadCount: state.unreadCount + 1,
        snackbar: { open: true, payload: withId },
      };
    });
  },

  markAllRead: () => {
    set({ unreadCount: 0 });
  },

  clearAll: () => {
    set({ items: [], unreadCount: 0 });
  },

  closeSnackbar: () => {
    set((state) => ({ snackbar: { ...state.snackbar, open: false } }));
  },

  setupSocketListener: () => {
    const socket = getSocket();
    if (!socket) {
      // eslint-disable-next-line no-console
      console.warn('[Notifications] setupSocketListener: socket is null, retrying in 500ms');
      let cancelled = false;
      const retry = setTimeout(() => {
        if (!cancelled) get().setupSocketListener();
      }, 500);
      return () => { cancelled = true; clearTimeout(retry); };
    }
    // eslint-disable-next-line no-console
    console.log('[Notifications] setupSocketListener: attaching handler, socket id=', socket.id);
    const handler = (payload: NotificationPayload) => {
      // eslint-disable-next-line no-console
      console.log('[Notifications] socket event "notification" received payload:', payload);
      get().push(payload);
    };
    socket.on('notification', handler);
    socket.on('connect', () => {
      // eslint-disable-next-line no-console
      console.log('[Notifications] socket connected, id=', socket.id);
    });
    socket.on('disconnect', (reason) => {
      // eslint-disable-next-line no-console
      console.log('[Notifications] socket disconnected, reason=', reason);
    });
    return () => {
      // eslint-disable-next-line no-console
      console.log('[Notifications] cleanup: removing listener');
      socket.off('notification', handler);
    };
  },
}));
