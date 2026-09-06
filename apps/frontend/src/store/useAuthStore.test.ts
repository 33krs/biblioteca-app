import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from './useAuthStore';
import * as authApi from '../lib/auth';
import type { AuthUser } from '../lib/auth';

vi.mock('../lib/auth');

const user: AuthUser = { id: 'u1', email: 'a@test.com', name: 'Ana' };

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  useAuthStore.setState({ user: null, ready: false, error: null });
});

describe('hydrate', () => {
  it('sin token guardado, queda listo sin usuario', async () => {
    await useAuthStore.getState().hydrate();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().ready).toBe(true);
  });

  it('con token guardado válido, recupera el usuario', async () => {
    localStorage.setItem('biblioteca.token', 'valid-token');
    vi.mocked(authApi.fetchMe).mockResolvedValue(user);

    await useAuthStore.getState().hydrate();

    expect(authApi.fetchMe).toHaveBeenCalledWith('valid-token');
    expect(useAuthStore.getState().user).toEqual(user);
    expect(useAuthStore.getState().ready).toBe(true);
  });

  it('con token guardado inválido, limpia la sesión', async () => {
    localStorage.setItem('biblioteca.token', 'expired-token');
    vi.mocked(authApi.fetchMe).mockRejectedValue(new Error('Sesión inválida'));

    await useAuthStore.getState().hydrate();

    expect(useAuthStore.getState().user).toBeNull();
    expect(localStorage.getItem('biblioteca.token')).toBeNull();
  });
});

describe('login', () => {
  it('guarda el token y el usuario', async () => {
    vi.mocked(authApi.login).mockResolvedValue({ token: 'tok', user });

    await useAuthStore.getState().login('a@test.com', 'password123');

    expect(localStorage.getItem('biblioteca.token')).toBe('tok');
    expect(useAuthStore.getState().user).toEqual(user);
  });

  it('propaga el error sin guardar nada si falla', async () => {
    vi.mocked(authApi.login).mockRejectedValue(new Error('Email o contraseña incorrectos'));

    await expect(useAuthStore.getState().login('a@test.com', 'mala')).rejects.toThrow(
      'Email o contraseña incorrectos',
    );
    expect(useAuthStore.getState().user).toBeNull();
    expect(localStorage.getItem('biblioteca.token')).toBeNull();
  });
});

describe('register', () => {
  it('guarda el token y el usuario', async () => {
    vi.mocked(authApi.register).mockResolvedValue({ token: 'tok', user });

    await useAuthStore.getState().register('a@test.com', 'password123', 'Ana');

    expect(localStorage.getItem('biblioteca.token')).toBe('tok');
    expect(useAuthStore.getState().user).toEqual(user);
  });
});

describe('logout', () => {
  it('borra el token y el usuario', () => {
    localStorage.setItem('biblioteca.token', 'tok');
    useAuthStore.setState({ user });

    useAuthStore.getState().logout();

    expect(localStorage.getItem('biblioteca.token')).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });
});
