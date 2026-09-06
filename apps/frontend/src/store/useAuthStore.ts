import { create } from 'zustand';
import * as authApi from '../lib/auth';
import type { AuthUser } from '../lib/auth';
import { getToken, setToken, clearToken } from '../lib/token';

interface AuthState {
  user: AuthUser | null;
  ready: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  ready: false,
  error: null,

  // Al arrancar la app, si hay un token guardado se valida contra /api/auth/me
  // en vez de asumir que sigue siendo válido (pudo expirar o el usuario pudo
  // haber sido borrado).
  hydrate: async () => {
    const token = getToken();
    if (!token) {
      set({ ready: true });
      return;
    }
    try {
      const user = await authApi.fetchMe(token);
      set({ user, ready: true });
    } catch {
      clearToken();
      set({ user: null, ready: true });
    }
  },

  login: async (email, password) => {
    set({ error: null });
    const { token, user } = await authApi.login(email, password);
    setToken(token);
    set({ user });
  },

  register: async (email, password, name) => {
    set({ error: null });
    const { token, user } = await authApi.register(email, password, name);
    setToken(token);
    set({ user });
  },

  forgotPassword: async (email) => {
    set({ error: null });
    await authApi.forgotPassword(email);
  },

  logout: () => {
    clearToken();
    set({ user: null });
  },
}));
