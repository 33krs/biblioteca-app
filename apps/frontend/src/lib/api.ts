import type { UserBook, NewBookPayload, GoogleBookResult } from '../types';

const BASE = '/api/shelf';

export async function fetchShelf(): Promise<UserBook[]> {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error('No se pudo cargar la estantería');
  return res.json();
}

export async function searchBooks(query: string, signal?: AbortSignal): Promise<GoogleBookResult[]> {
  const res = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`, { signal });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || `No se pudo buscar en Google Books (HTTP ${res.status})`);
  }
  return res.json();
}

export async function addBook(payload: NewBookPayload): Promise<UserBook> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('No se pudo añadir el libro');
  return res.json();
}

export async function updateShelfItem(id: string, patch: Partial<UserBook>): Promise<UserBook> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error('No se pudo actualizar el libro');
  return res.json();
}

export async function deleteShelfItem(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('No se pudo eliminar el libro');
}

export async function uploadCover(id: string, file: File): Promise<UserBook> {
  const formData = new FormData();
  formData.append('cover', file);
  const res = await fetch(`${BASE}/${id}/cover`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('No se pudo subir la portada');
  return res.json();
}
