import type { UserBook, NewBookPayload, GoogleBookResult } from '../types';
import { getToken } from './token';
import { useAuthStore } from '../store/useAuthStore';

const BASE = '/api/shelf';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string | null,
    public readonly requestId: string | null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function isErrorPayload(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

async function apiError(response: Response, fallback: string): Promise<ApiError> {
  const body: unknown = await response.json().catch(() => null);
  const payload = isErrorPayload(body) ? body : {};

  return new ApiError(
    nonEmptyString(payload.error) ?? fallback,
    nonEmptyString(payload.code),
    nonEmptyString(payload.requestId) ?? nonEmptyString(response.headers.get('X-Request-ID')),
  );
}

// Adjunta el token a las rutas de /api/shelf (requieren sesión) y, si el
// backend responde 401 (token ausente, inválido o expirado), cierra la
// sesión local para que la UI vuelva a la pantalla de login.
async function authedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(input, { ...init, headers });
  if (res.status === 401) {
    useAuthStore.getState().logout();
  }
  return res;
}

export async function fetchShelf(): Promise<UserBook[]> {
  const res = await authedFetch(BASE);
  if (!res.ok) throw await apiError(res, 'No se pudo cargar la estantería');
  return res.json();
}

export async function searchBooks(
  query: string,
  signal?: AbortSignal,
): Promise<GoogleBookResult[]> {
  const res = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`, { signal });
  if (!res.ok) {
    throw await apiError(res, `No se pudo buscar en Google Books (HTTP ${res.status})`);
  }
  return res.json();
}

export async function addBook(payload: NewBookPayload): Promise<UserBook> {
  const res = await authedFetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await apiError(res, 'No se pudo añadir el libro');
  return res.json();
}

export async function updateShelfItem(id: string, patch: Partial<UserBook>): Promise<UserBook> {
  const res = await authedFetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw await apiError(res, 'No se pudo actualizar el libro');
  return res.json();
}

export async function deleteShelfItem(id: string): Promise<void> {
  const res = await authedFetch(`${BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw await apiError(res, 'No se pudo eliminar el libro');
}

export async function uploadCover(id: string, file: File): Promise<UserBook> {
  const formData = new FormData();
  formData.append('cover', file);
  const res = await authedFetch(`${BASE}/${id}/cover`, { method: 'POST', body: formData });
  if (!res.ok) throw await apiError(res, 'No se pudo subir la portada');
  return res.json();
}
