import { beforeEach, describe, expect, it } from 'vitest';
import { addCsrfHeader, getCsrfToken } from './csrf';

beforeEach(() => {
  document.cookie = 'biblioteca.csrf=; Max-Age=0; Path=/';
});

describe('getCsrfToken', () => {
  it('reads and decodes the CSRF cookie', () => {
    document.cookie = 'biblioteca.csrf=token%2Fvalue; Path=/';

    expect(getCsrfToken()).toBe('token/value');
  });
});

describe('addCsrfHeader', () => {
  it('adds the CSRF header only to mutating requests', () => {
    document.cookie = 'biblioteca.csrf=token-value; Path=/';
    const mutationHeaders = new Headers();
    const readHeaders = new Headers();

    addCsrfHeader(mutationHeaders, 'PATCH');
    addCsrfHeader(readHeaders, 'GET');

    expect(mutationHeaders.get('X-CSRF-Token')).toBe('token-value');
    expect(readHeaders.get('X-CSRF-Token')).toBeNull();
  });
});
