export type ReadingStatus = 'TO_READ' | 'READING' | 'READ';

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string | null;
  defaultCoverUrl?: string | null;
}

export interface UserBook {
  id: string;
  bookId: string;
  book: Book;
  status: ReadingStatus;
  rating: number | null;
  review: string | null;
  notes: string | null;
  customCoverUrl: string | null;
}

export interface GoogleBookResult {
  externalId: string;
  title: string;
  author: string;
  coverUrl?: string;
  isbn?: string;
  publishedYear?: number;
  description?: string;
}

export interface NewBookPayload {
  title: string;
  author: string;
  coverUrl?: string;
  isbn?: string;
  publishedYear?: number;
  description?: string;
  externalId?: string;
}
