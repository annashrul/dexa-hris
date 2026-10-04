import { create } from 'zustand';
import api from '../lib/api';
import { createSocket, disconnectSocket } from '../lib/socket';

export interface User {
  id: number | string;
  name: string;
  email: string;
  role: string;
  position?: string;
  phone?: string;
  photo?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  init: () => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isHydrated: false,

  init: () => {
    if (get().isHydrated) return;
    const token = localStorage.getItem('admin_token');
    const userRaw = localStorage.getItem('admin_user');
    let hydratedUser: User | null = null;
    let hydratedToken: string | null = null;
    let authed = false;
    if (token && userRaw) {
      try {
        const user = JSON.parse(userRaw) as User;
        const role = String(user.role || '').toLowerCase();
        if (role === 'hrd' || role === 'admin') {
          user.role = 'hrd';
          hydratedUser = user;
          hydratedToken = token;
          authed = true;
        }
      } catch {
        // ignore
      }
    }
    try {
      if (authed && hydratedUser) {
        createSocket(hydratedUser.id, 'hrd');
      }
    } catch {
      // ignore socket errors on init
    }
    set({
      user: hydratedUser,
      token: hydratedToken,
      isAuthenticated: authed,
      isHydrated: true,
    });
  },

  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    const user = (data.user ?? data) as User;
    const rawToken = data.token ?? data.accessToken;
    const token = String(rawToken ?? data.access_token ?? '');
    const role = String(user.role || '').toLowerCase();
    if (role !== 'hrd' && role !== 'admin') {
      throw new Error('Akses hanya untuk HRD');
    }
    user.role = 'hrd';
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_user', JSON.stringify(user));
    try {
      createSocket(user.id, 'hrd');
    } catch {
      // ignore
    }
    set({ user, token, isAuthenticated: true, isHydrated: true });
  },

  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    try { disconnectSocket(); } catch {}
    set({ user: null, token: null, isAuthenticated: false, isHydrated: true });
  },
}));
