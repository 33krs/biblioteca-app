import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

// Estos tests simulan `fetch` para no depender de la red real: tanto Google
// Books como Open Library son APIs públicas con cuota/latencia poco fiables
// (ver diagnóstico previo), así que la suite no debe pegarles de verdad.

const app = createApp();

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('GET /api/books/search', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('devuelve [] si no hay query, sin llamar a ninguna API', async () => {
    const res = await request(app).get('/api/books/search');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('devuelve resultados de Google Books cuando responde OK', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({
        items: [
          {
            id: 'g1',
            volumeInfo: { title: 'Dune', authors: ['Frank Herbert'], publishedDate: '1965' },
          },
        ],
      }),
    );

    const res = await request(app).get('/api/books/search?q=dune');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      expect.objectContaining({ externalId: 'g1', title: 'Dune', author: 'Frank Herbert', publishedYear: 1965 }),
    ]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('cae a Open Library si Google Books falla', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ error: 'quota exceeded' }, 429))
      .mockResolvedValueOnce(
        jsonResponse({
          docs: [{ key: '/works/OL1W', title: 'Dune', author_name: ['Frank Herbert'] }],
        }),
      );

    const res = await request(app).get('/api/books/search?q=dune');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      expect.objectContaining({ externalId: '/works/OL1W', title: 'Dune', author: 'Frank Herbert' }),
    ]);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('responde 502 si tanto Google Books como Open Library fallan', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ error: 'down' }, 500));

    const res = await request(app).get('/api/books/search?q=dune');

    expect(res.status).toBe(502);
    expect(res.body.error).toBeTruthy();
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
