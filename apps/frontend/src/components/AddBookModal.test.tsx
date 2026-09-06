import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import AddBookModal from './AddBookModal';
import * as api from '../lib/api';

// `waitFor`/`findBy*` de Testing Library dependen de timers reales para su
// polling, así que con fake timers hay que avanzarlos dentro de `act` y
// consultar el DOM de forma síncrona en vez de usar `findBy*`.
async function advanceTimers(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

// Regresión del bug diagnosticado: la búsqueda no debía dispararse con menos
// de 3 caracteres, y una búsqueda nueva debía cancelar la anterior en vez de
// dejarlas competir (ver AddBookModal.tsx).
vi.mock('../lib/api');

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('AddBookModal - búsqueda', () => {
  it('no busca con menos de 3 caracteres', async () => {
    render(<AddBookModal onClose={() => {}} onAdd={() => {}} />);
    const input = screen.getByPlaceholderText('Título o autor...');

    fireEvent.change(input, { target: { value: 'Du' } });
    await advanceTimers(500);

    expect(api.searchBooks).not.toHaveBeenCalled();
  });

  it('busca (con debounce) y muestra resultados desde 3 caracteres', async () => {
    vi.mocked(api.searchBooks).mockResolvedValue([
      { externalId: 'g1', title: 'Dune', author: 'Frank Herbert' },
    ]);
    render(<AddBookModal onClose={() => {}} onAdd={() => {}} />);
    const input = screen.getByPlaceholderText('Título o autor...');

    fireEvent.change(input, { target: { value: 'Dun' } });
    await advanceTimers(100);
    expect(api.searchBooks).not.toHaveBeenCalled();

    await advanceTimers(400);
    expect(api.searchBooks).toHaveBeenCalledWith('Dun', expect.anything());
    expect(screen.getByText('Dune')).toBeTruthy();
  });

  it('cancela la búsqueda anterior cuando el usuario sigue escribiendo', async () => {
    vi.mocked(api.searchBooks).mockResolvedValue([]);
    render(<AddBookModal onClose={() => {}} onAdd={() => {}} />);
    const input = screen.getByPlaceholderText('Título o autor...');

    fireEvent.change(input, { target: { value: 'Dun' } });
    await advanceTimers(200);
    fireEvent.change(input, { target: { value: 'Dune' } });
    await advanceTimers(400);

    // Solo debe haberse disparado la búsqueda final, no la intermedia.
    expect(api.searchBooks).toHaveBeenCalledTimes(1);
    expect(api.searchBooks).toHaveBeenCalledWith('Dune', expect.anything());
  });

  it('seleccionar un resultado completa título y autor', async () => {
    vi.mocked(api.searchBooks).mockResolvedValue([
      { externalId: 'g1', title: 'Dune', author: 'Frank Herbert' },
    ]);
    render(<AddBookModal onClose={() => {}} onAdd={() => {}} />);
    const input = screen.getByPlaceholderText('Título o autor...');

    fireEvent.change(input, { target: { value: 'Dune' } });
    await advanceTimers(400);
    fireEvent.click(screen.getByText('Dune'));

    expect((screen.getByLabelText('Título') as HTMLInputElement).value).toBe('Dune');
    expect((screen.getByLabelText('Autor') as HTMLInputElement).value).toBe('Frank Herbert');
  });
});

describe('AddBookModal - alta manual', () => {
  it('llama a onAdd con los datos escritos a mano', async () => {
    const onAdd = vi.fn();
    const onClose = vi.fn();
    render(<AddBookModal onClose={onClose} onAdd={onAdd} />);

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'El Aleph' } });
    fireEvent.change(screen.getByLabelText('Autor'), { target: { value: 'Jorge Luis Borges' } });
    fireEvent.click(screen.getByText('Añadir a la estantería'));

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'El Aleph', author: 'Jorge Luis Borges' }),
    );
    expect(onClose).toHaveBeenCalled();
  });
});
