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

function seedRecoveryState() {
  useLibraryStore.setState({
    error: { message: 'Previous failure', code: 'FAILED', requestId: 'req-old' },
    retry: vi.fn().mockResolvedValue(undefined),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  useLibraryStore.setState({
    books: [],
    loading: false,
    error: null,
    retry: null,
    filter: 'ALL',
    query: '',
  });
});

describe('load', () => {
  it('clears stale recovery controls while a fresh load is pending', async () => {
    seedRecoveryState();
    let resolveFetch!: (books: UserBook[]) => void;
    vi.mocked(api.fetchShelf).mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );

    const loading = useLibraryStore.getState().load();

    expect(useLibraryStore.getState().loading).toBe(true);
    expect(useLibraryStore.getState().error).toBeNull();
    expect(useLibraryStore.getState().retry).toBeNull();

    resolveFetch([makeUserBook()]);
    await loading;
  });

  it('carga los libros y limpia el error', async () => {
    seedRecoveryState();
    vi.mocked(api.fetchShelf).mockResolvedValue([makeUserBook()]);

    await useLibraryStore.getState().load();

    expect(useLibraryStore.getState().books).toHaveLength(1);
    expect(useLibraryStore.getState().loading).toBe(false);
    expect(useLibraryStore.getState().error).toBeNull();
    expect(useLibraryStore.getState().retry).toBeNull();
  });

  it('guarda el mensaje de error si falla', async () => {
    vi.mocked(api.fetchShelf).mockRejectedValue(new Error('No se pudo cargar la estantería'));

    await useLibraryStore.getState().load();

    expect(useLibraryStore.getState().books).toEqual([]);
    expect(useLibraryStore.getState().error).toMatchObject({
      message: 'No se pudo cargar la estantería',
      requestId: null,
    });
    expect((useLibraryStore.getState() as { retry?: unknown }).retry).toEqual(expect.any(Function));
    expect(useLibraryStore.getState().loading).toBe(false);
  });
});

describe('addBook', () => {
  it('agrega el libro devuelto por la API al estado', async () => {
    seedRecoveryState();
    const created = makeUserBook();
    vi.mocked(api.addBook).mockResolvedValue(created);

    await useLibraryStore.getState().addBook({ title: 'Dune', author: 'Frank Herbert' });

    expect(useLibraryStore.getState().books).toEqual([created]);
    expect(useLibraryStore.getState().error).toBeNull();
    expect(useLibraryStore.getState().retry).toBeNull();
  });
});

describe('updateBook', () => {
  it('reemplaza solo el libro actualizado', async () => {
    seedRecoveryState();
    const original = makeUserBook({ id: 'ub1', status: 'TO_READ' });
    const other = makeUserBook({ id: 'ub2', status: 'READING' });
    const updated = makeUserBook({ id: 'ub1', status: 'READ' });
    useLibraryStore.setState({ books: [original, other] });
    vi.mocked(api.updateShelfItem).mockResolvedValue(updated);

    await useLibraryStore.getState().updateBook('ub1', { status: 'READ' });

    expect(useLibraryStore.getState().books).toEqual([updated, other]);
    expect(useLibraryStore.getState().error).toBeNull();
    expect(useLibraryStore.getState().retry).toBeNull();
  });
});

describe('deleteBook', () => {
  it('quita el libro del estado', async () => {
    seedRecoveryState();
    const toDelete = makeUserBook({ id: 'ub1' });
    const other = makeUserBook({ id: 'ub2' });
    useLibraryStore.setState({ books: [toDelete, other] });
    vi.mocked(api.deleteShelfItem).mockResolvedValue(undefined);

    await useLibraryStore.getState().deleteBook('ub1');

    expect(useLibraryStore.getState().books).toEqual([other]);
    expect(useLibraryStore.getState().error).toBeNull();
    expect(useLibraryStore.getState().retry).toBeNull();
  });
});

describe('uploadCover', () => {
  it('clears stale recovery state after uploading a cover', async () => {
    const original = makeUserBook({ id: 'ub1' });
    const updated = makeUserBook({ id: 'ub1', customCoverUrl: '/covers/new.png' });
    useLibraryStore.setState({ books: [original] });
    seedRecoveryState();
    vi.mocked(api.uploadCover).mockResolvedValue(updated);

    await useLibraryStore.getState().uploadCover('ub1', new File(['cover'], 'cover.png'));

    expect(useLibraryStore.getState().books).toEqual([updated]);
    expect(useLibraryStore.getState().error).toBeNull();
    expect(useLibraryStore.getState().retry).toBeNull();
  });
});
