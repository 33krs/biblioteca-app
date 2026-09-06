import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useLibraryStore } from './useLibraryStore';
import * as api from '../lib/api';
import type { UserBook } from '../types';

vi.mock('../lib/api');

function makeUserBook(overrides: Partial<UserBook> = {}): UserBook {
  return {
    id: 'ub1',
    bookId: 'b1',
    book: { id: 'b1', title: 'Dune', author: 'Frank Herbert' },
    status: 'TO_READ',
    rating: null,
    review: null,
    notes: null,
    customCoverUrl: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  useLibraryStore.setState({ books: [], loading: false, error: null, filter: 'ALL', query: '' });
});

describe('load', () => {
  it('carga los libros y limpia el error', async () => {
    vi.mocked(api.fetchShelf).mockResolvedValue([makeUserBook()]);

    await useLibraryStore.getState().load();

    expect(useLibraryStore.getState().books).toHaveLength(1);
    expect(useLibraryStore.getState().loading).toBe(false);
    expect(useLibraryStore.getState().error).toBeNull();
  });

  it('guarda el mensaje de error si falla', async () => {
    vi.mocked(api.fetchShelf).mockRejectedValue(new Error('No se pudo cargar la estantería'));

    await useLibraryStore.getState().load();

    expect(useLibraryStore.getState().books).toEqual([]);
    expect(useLibraryStore.getState().error).toBe('No se pudo cargar la estantería');
    expect(useLibraryStore.getState().loading).toBe(false);
  });
});

describe('addBook', () => {
  it('agrega el libro devuelto por la API al estado', async () => {
    const created = makeUserBook();
    vi.mocked(api.addBook).mockResolvedValue(created);

    await useLibraryStore.getState().addBook({ title: 'Dune', author: 'Frank Herbert' });

    expect(useLibraryStore.getState().books).toEqual([created]);
  });
});

describe('updateBook', () => {
  it('reemplaza solo el libro actualizado', async () => {
    const original = makeUserBook({ id: 'ub1', status: 'TO_READ' });
    const other = makeUserBook({ id: 'ub2', status: 'READING' });
    const updated = makeUserBook({ id: 'ub1', status: 'READ' });
    useLibraryStore.setState({ books: [original, other] });
    vi.mocked(api.updateShelfItem).mockResolvedValue(updated);

    await useLibraryStore.getState().updateBook('ub1', { status: 'READ' });

    expect(useLibraryStore.getState().books).toEqual([updated, other]);
  });
});

describe('deleteBook', () => {
  it('quita el libro del estado', async () => {
    const toDelete = makeUserBook({ id: 'ub1' });
    const other = makeUserBook({ id: 'ub2' });
    useLibraryStore.setState({ books: [toDelete, other] });
    vi.mocked(api.deleteShelfItem).mockResolvedValue(undefined);

    await useLibraryStore.getState().deleteBook('ub1');

    expect(useLibraryStore.getState().books).toEqual([other]);
  });
});
