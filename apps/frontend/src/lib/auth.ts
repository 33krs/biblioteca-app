export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

export interface AuthResponse {
  user: AuthUser;
}

const BASE = '/api/auth';

async function parseAuthResponse(res: Response, fallbackError: string): Promise<AuthResponse> {
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error || fallbackError);
  return body;
}

export async function register(
  email: string,
  password: string,
  name?: string,
): Promise<AuthResponse> {
  const res = await fetch(`${BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
    credentials: 'include',
  });
  return parseAuthResponse(res, 'No se pudo crear la cuenta');
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });
  return parseAuthResponse(res, 'No se pudo iniciar sesión');
}

export async function fetchMe(): Promise<AuthUser> {
  const res = await fetch(`${BASE}/me`, { credentials: 'include' });
  if (!res.ok) throw new Error('Sesión inválida');
  const body = await res.json();
  return body.user;
}

export async function logout(csrfToken: string | null): Promise<void> {
  const headers = new Headers();
  if (csrfToken) headers.set('X-CSRF-Token', csrfToken);

  const res = await fetch(`${BASE}/logout`, { method: 'POST', headers, credentials: 'include' });
  if (!res.ok && res.status !== 401) throw new Error('No se pudo cerrar la sesión');
}

export async function forgotPassword(email: string): Promise<void> {
  const res = await fetch(`${BASE}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
    credentials: 'include',
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error || 'No se pudo procesar la solicitud');
}

export async function resetPassword(token: string, password: string): Promise<void> {
  const res = await fetch(`${BASE}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
    credentials: 'include',
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error || 'No se pudo actualizar la contraseña');
}
