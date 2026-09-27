import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('GET /api/health', () => {
  it('reports the service as healthy without authentication', async () => {
    const app = createApp();
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('remains healthy when the readiness dependency fails', async () => {
    const failingReadinessProbe = vi.fn().mockRejectedValue(new Error('database unavailable'));
    const app = createApp(failingReadinessProbe);

    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(failingReadinessProbe).not.toHaveBeenCalled();
  });
});

describe('GET /api/ready', () => {
  it('reports readiness when the database probe succeeds', async () => {
    const readinessProbe = vi.fn().mockResolvedValue(undefined);
    const app = createApp(readinessProbe);

    const res = await request(app).get('/api/ready');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(readinessProbe).toHaveBeenCalledOnce();
  });

  it('reports unavailability without leaking database failure details', async () => {
    const readinessProbe = vi
      .fn()
      .mockRejectedValue(new Error('connection refused at database.internal:5432'));
    const app = createApp(readinessProbe);

    const res = await request(app).get('/api/ready');

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ ok: false });
    expect(readinessProbe).toHaveBeenCalledOnce();
    expect(res.text).not.toContain('database.internal');
    expect(res.text).not.toContain('connection refused');
  });
});
