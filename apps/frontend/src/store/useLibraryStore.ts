import { create } from 'zustand';
import type { UserBook, ReadingStatus, NewBookPayload } from '../types';
import * as api from '../lib/api';

interface LibraryState {
  books: UserBook[];
  loading: boolean;
  error: string | null;
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

export const useLibraryStore = create<LibraryState>((set, get) => ({
  books: [],
  loading: false,
  error: null,
  filter: 'ALL',
  query: '',
  setFilter: (filter) => set({ filter }),
  setQuery: (query) => set({ query }),

  load: async () => {
    set({ loading: true, error: null });
    try {
      const books = await api.fetchShelf();
      set({ books, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  addBook: async (payload) => {
    const userBook = await api.addBook(payload);
    set({ books: [...get().books, userBook] });
  },

  updateBook: async (id, patch) => {
    const updated = await api.updateShelfItem(id, patch);
    set({ books: get().books.map((b) => (b.id === id ? updated : b)) });
  },

  deleteBook: async (id) => {
    await api.deleteShelfItem(id);
    set({ books: get().books.filter((b) => b.id !== id) });
  },

  uploadCover: async (id, file) => {
    const updated = await api.uploadCover(id, file);
    set({ books: get().books.map((b) => (b.id === id ? updated : b)) });
  },
}));
