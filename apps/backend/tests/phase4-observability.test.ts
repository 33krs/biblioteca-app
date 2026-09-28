import { afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const REQUEST_ID = '11111111-1111-4111-8111-111111111111';

describe('Phase 4 request observability', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('propagates a validated request ID in the response header', async () => {
    const res = await request(createApp()).get('/api/health').set('X-Request-ID', REQUEST_ID);

    expect(res.status).toBe(200);
    expect(res.headers['x-request-id']).toBe(REQUEST_ID);
  });

  it('includes the request ID in JSON authentication errors', async () => {
    const res = await request(createApp()).get('/api/shelf');

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      code: 'AUTHENTICATION_REQUIRED',
      requestId: expect.any(String),
    });
    expect(res.body.requestId).toBe(res.headers['x-request-id']);
  });

  it('logs upstream failures as safe JSON without the search query', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('upstream secret response'));
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const privateQuery = 'private-query@example.com';

    const res = await request(createApp()).get('/api/books/search').query({ q: privateQuery });

    expect(res.status).toBe(502);
    expect(res.body).toMatchObject({
      code: 'UPSTREAM_ERROR',
      requestId: res.headers['x-request-id'],
    });

    const logs = [...info.mock.calls, ...error.mock.calls].map(([entry]) => String(entry));
    expect(logs.join('\n')).not.toContain(privateQuery);
    expect(logs.every((entry) => expect(() => JSON.parse(entry)).not.toThrow())).toBe(true);
  });
});
