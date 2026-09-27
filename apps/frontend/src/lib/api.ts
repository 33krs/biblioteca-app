import type { UserBook, NewBookPayload, GoogleBookResult } from '../types';
import { useAuthStore } from '../store/useAuthStore';
import { addCsrfHeader } from './csrf';

const BASE = '/api/shelf';

// Envía las cookies de sesión a las rutas autenticadas y adjunta el token CSRF
// sólo a las mutaciones. Una respuesta 401 descarta el estado local para que
// la UI vuelva a la pantalla de login.
async function authedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  addCsrfHeader(headers, init.method);

  const res = await fetch(input, { ...init, headers, credentials: 'include' });
  if (res.status === 401) {
    useAuthStore.setState({ user: null });
  }
  return res;
}

export async function fetchShelf(): Promise<UserBook[]> {
  const res = await authedFetch(BASE);
  if (!res.ok) throw new Error('No se pudo cargar la estantería');
  return res.json();
}

export async function searchBooks(
  query: string,
  signal?: AbortSignal,
): Promise<GoogleBookResult[]> {
  const res = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`, { signal });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || `No se pudo buscar en Google Books (HTTP ${res.status})`);
  }
  return res.json();
}

export async function addBook(payload: NewBookPayload): Promise<UserBook> {
  const res = await authedFetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('No se pudo añadir el libro');
  return res.json();
}

export async function updateShelfItem(id: string, patch: Partial<UserBook>): Promise<UserBook> {
  const res = await authedFetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error('No se pudo actualizar el libro');
  return res.json();
}

export async function deleteShelfItem(id: string): Promise<void> {
  const res = await authedFetch(`${BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('No se pudo eliminar el libro');
}

export async function uploadCover(id: string, file: File): Promise<UserBook> {
  const formData = new FormData();
  formData.append('cover', file);
  const res = await authedFetch(`${BASE}/${id}/cover`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('No se pudo subir la portada');
  return res.json();
}
