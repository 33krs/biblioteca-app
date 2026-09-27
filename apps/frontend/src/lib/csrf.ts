const CSRF_COOKIE_NAME = 'biblioteca.csrf';

export function getCsrfToken(): string | null {
  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${CSRF_COOKIE_NAME}=`));
  if (!cookie) return null;

  return decodeURIComponent(cookie.slice(`${CSRF_COOKIE_NAME}=`.length));
}

export function addCsrfHeader(headers: Headers, method?: string): void {
  if (!method || ['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) return;

  const csrfToken = getCsrfToken();
  if (csrfToken) headers.set('X-CSRF-Token', csrfToken);
}
