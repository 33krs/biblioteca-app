const KEY = 'biblioteca.token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(KEY, token);
  } catch {
    // Almacenamiento no disponible (modo privado, etc.): la sesión no
    // persistirá entre recargas, pero la pestaña actual sigue funcionando.
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ver setToken
  }
}
