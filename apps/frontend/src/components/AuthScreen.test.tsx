import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuthScreen from './AuthScreen';
import { useAuthStore } from '../store/useAuthStore';

vi.mock('../store/useAuthStore');

beforeEach(() => {
  vi.resetAllMocks();
});

function mockStore(overrides: Partial<ReturnType<typeof useAuthStore>>) {
  vi.mocked(useAuthStore).mockReturnValue({
    user: null,
    ready: true,
    error: null,
    hydrate: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  });
}

describe('AuthScreen', () => {
  it('por defecto muestra el formulario de login y llama a login al enviar', async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    mockStore({ login });

    render(<AuthScreen />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@test.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('Entrar'));

    await waitFor(() => expect(login).toHaveBeenCalledWith('a@test.com', 'password123'));
  });

  it('cambia a registro y llama a register con el nombre', async () => {
    const register = vi.fn().mockResolvedValue(undefined);
    mockStore({ register });

    render(<AuthScreen />);
    fireEvent.click(screen.getByText('¿No tienes cuenta? Regístrate'));

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@test.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('Crear cuenta'));

    await waitFor(() => expect(register).toHaveBeenCalledWith('a@test.com', 'password123', 'Ana'));
  });

  it('muestra el mensaje de error si login falla', async () => {
    const login = vi.fn().mockRejectedValue(new Error('Email o contraseña incorrectos'));
    mockStore({ login });

    render(<AuthScreen />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@test.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'mala-clave' } });
    fireEvent.click(screen.getByText('Entrar'));

    expect(await screen.findByText('Email o contraseña incorrectos')).toBeTruthy();
  });
});
