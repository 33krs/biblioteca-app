import { create } from 'zustand';
import * as authApi from '../lib/auth';
import type { AuthUser } from '../lib/auth';
import { getCsrfToken } from '../lib/csrf';

interface AuthState {
  user: AuthUser | null;
  ready: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  ready: false,
  error: null,

  // Al arrancar la app, la cookie HttpOnly se valida contra /api/auth/me.
  hydrate: async () => {
    try {
      const user = await authApi.fetchMe();
      set({ user, ready: true });
    } catch {
      set({ user: null, ready: true });
    }
  },

  login: async (email, password) => {
    set({ error: null });
    const { user } = await authApi.login(email, password);
    set({ user });
  },

  register: async (email, password, name) => {
    set({ error: null });
    const { user } = await authApi.register(email, password, name);
    set({ user });
  },

  forgotPassword: async (email) => {
    set({ error: null });
    await authApi.forgotPassword(email);
  },

  logout: async () => {
    try {
      await authApi.logout(getCsrfToken());
    } finally {
      set({ user: null });
    }
  },
}));
