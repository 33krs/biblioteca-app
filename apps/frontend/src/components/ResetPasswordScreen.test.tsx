import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ResetPasswordScreen from './ResetPasswordScreen';
import * as authApi from '../lib/auth';

vi.mock('../lib/auth');

beforeEach(() => {
  vi.resetAllMocks();
});

describe('ResetPasswordScreen', () => {
  it('envía el token y la contraseña nueva, y muestra éxito', async () => {
    vi.mocked(authApi.resetPassword).mockResolvedValue(undefined);
    const onDone = vi.fn();

    render(<ResetPasswordScreen token="abc123" onDone={onDone} />);

    fireEvent.change(screen.getByLabelText('Contraseña nueva'), { target: { value: 'nuevaClave123' } });
    fireEvent.click(screen.getByText('Guardar contraseña'));

    await waitFor(() => expect(authApi.resetPassword).toHaveBeenCalledWith('abc123', 'nuevaClave123'));
    expect(await screen.findByText('Tu contraseña se actualizó correctamente.')).toBeTruthy();

    fireEvent.click(screen.getByText('Ir a iniciar sesión'));
    expect(onDone).toHaveBeenCalled();
  });

  it('muestra el error si el token es inválido o expiró', async () => {
    vi.mocked(authApi.resetPassword).mockRejectedValue(new Error('El link de reseteo es inválido o expiró'));

    render(<ResetPasswordScreen token="expirado" onDone={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Contraseña nueva'), { target: { value: 'nuevaClave123' } });
    fireEvent.click(screen.getByText('Guardar contraseña'));

    expect(await screen.findByText('El link de reseteo es inválido o expiró')).toBeTruthy();
  });
});
