import { create } from 'zustand';
import type { UserBook, ReadingStatus, NewBookPayload } from '../types';
import { ApiError } from '../lib/api';
import * as api from '../lib/api';

interface RecoverableError {
  message: string;
  code: string | null;
  requestId: string | null;
}

interface LibraryState {
  books: UserBook[];
  loading: boolean;
  error: RecoverableError | null;
  retry: (() => Promise<void>) | null;
  filter: ReadingStatus | 'ALL';
  query: string;
  setFilter: (f: ReadingStatus | 'ALL') => void;
  setQuery: (q: string) => void;
  load: () => Promise<void>;
  addBook: (payload: NewBookPayload) => Promise<void>;
  updateBook: (id: string, patch: Partial<UserBook>) => Promise<void>;
  deleteBook: (id: string) => Promise<void>;
  uploadCover: (id: string, file: File) => Promise<void>;
}

function toRecoverableError(error: unknown): RecoverableError {
  if (error instanceof ApiError) {
    return { message: error.message, code: error.code, requestId: error.requestId };
  }

  return {
    message: error instanceof Error ? error.message : 'Ocurrió un error inesperado',
    code: null,
    requestId: null,
  };
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  books: [],
  loading: false,
  error: null,
  retry: null,
  filter: 'ALL',
  query: '',
  setFilter: (filter) => set({ filter }),
  setQuery: (query) => set({ query }),

  load: async () => {
    set({ loading: true, error: null, retry: null });
    try {
      const books = await api.fetchShelf();
      set({ books, loading: false });
    } catch (error) {
      set({ error: toRecoverableError(error), loading: false, retry: () => get().load() });
    }
  },

  addBook: async (payload) => {
    try {
      const userBook = await api.addBook(payload);
      set({ books: [...get().books, userBook] });
    } catch (error) {
      set({ error: toRecoverableError(error), retry: () => get().addBook(payload) });
      throw error;
    }
  },

  updateBook: async (id, patch) => {
    try {
      const updated = await api.updateShelfItem(id, patch);
      set({ books: get().books.map((b) => (b.id === id ? updated : b)) });
    } catch (error) {
      set({ error: toRecoverableError(error), retry: () => get().updateBook(id, patch) });
      throw error;
    }
  },

  deleteBook: async (id) => {
    try {
      await api.deleteShelfItem(id);
      set({ books: get().books.filter((b) => b.id !== id) });
    } catch (error) {
      set({ error: toRecoverableError(error), retry: () => get().deleteBook(id) });
      throw error;
    }
  },

  uploadCover: async (id, file) => {
    try {
      const updated = await api.uploadCover(id, file);
      set({ books: get().books.map((b) => (b.id === id ? updated : b)) });
    } catch (error) {
      set({ error: toRecoverableError(error), retry: () => get().uploadCover(id, file) });
      throw error;
    }
  },
}));
