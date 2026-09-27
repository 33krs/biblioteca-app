import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from './useAuthStore';
import * as authApi from '../lib/auth';
import type { AuthUser } from '../lib/auth';

vi.mock('../lib/auth');

const user: AuthUser = { id: 'u1', email: 'a@test.com', name: 'Ana' };

beforeEach(() => {
  vi.resetAllMocks();
  useAuthStore.setState({ user: null, ready: false, error: null });
});

describe('hydrate', () => {
  it('recupera el usuario desde la sesión por cookie', async () => {
    vi.mocked(authApi.fetchMe).mockResolvedValue(user);

    await useAuthStore.getState().hydrate();

    expect(authApi.fetchMe).toHaveBeenCalledWith();
    expect(useAuthStore.getState().user).toEqual(user);
    expect(useAuthStore.getState().ready).toBe(true);
  });

  it('queda listo sin usuario si no existe una sesión válida', async () => {
    vi.mocked(authApi.fetchMe).mockRejectedValue(new Error('Sesión inválida'));

    await useAuthStore.getState().hydrate();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().ready).toBe(true);
  });
});

describe('login', () => {
  it('guarda sólo el usuario en el estado de la aplicación', async () => {
    vi.mocked(authApi.login).mockResolvedValue({ user });

    await useAuthStore.getState().login('a@test.com', 'password123');

    expect(useAuthStore.getState().user).toEqual(user);
  });

  it('propaga el error si falla', async () => {
    vi.mocked(authApi.login).mockRejectedValue(new Error('Email o contraseña incorrectos'));

    await expect(useAuthStore.getState().login('a@test.com', 'mala')).rejects.toThrow(
      'Email o contraseña incorrectos',
    );
    expect(useAuthStore.getState().user).toBeNull();
  });
});

describe('register', () => {
  it('guarda el usuario en el estado de la aplicación', async () => {
    vi.mocked(authApi.register).mockResolvedValue({ user });

    await useAuthStore.getState().register('a@test.com', 'password123', 'Ana');

    expect(useAuthStore.getState().user).toEqual(user);
  });
});

describe('forgotPassword', () => {
  it('delega en la API sin tocar la sesión', async () => {
    vi.mocked(authApi.forgotPassword).mockResolvedValue(undefined);

    await useAuthStore.getState().forgotPassword('a@test.com');

    expect(authApi.forgotPassword).toHaveBeenCalledWith('a@test.com');
    expect(useAuthStore.getState().user).toBeNull();
  });
});

describe('logout', () => {
  it('solicita el cierre de sesión y limpia el usuario local', async () => {
    vi.mocked(authApi.logout).mockResolvedValue(undefined);
    useAuthStore.setState({ user });

    await useAuthStore.getState().logout();

    expect(authApi.logout).toHaveBeenCalledWith(null);
    expect(useAuthStore.getState().user).toBeNull();
  });
});
