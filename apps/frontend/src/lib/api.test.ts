import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchShelf } from './api';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchShelf', () => {
  it('preserves the server request ID in a recoverable API error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'Servicio no disponible', code: 'UPSTREAM_ERROR' }), {
          status: 502,
          headers: { 'Content-Type': 'application/json', 'X-Request-ID': 'req-123' },
        }),
      ),
    );

    await expect(fetchShelf()).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Servicio no disponible',
      code: 'UPSTREAM_ERROR',
      requestId: 'req-123',
    });
  });
});
