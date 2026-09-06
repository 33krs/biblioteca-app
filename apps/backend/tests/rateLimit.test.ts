import { describe, it, expect, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { makeLimiter } from '../src/middleware/rateLimit.js';

// Los tests de integración corren con DISABLE_RATE_LIMIT=true (ver
// .env.test) para no chocar con el resto de la suite. Acá lo prendemos
// puntualmente sobre una app mínima propia para probar el middleware en sí.
describe('makeLimiter', () => {
  afterEach(() => {
    process.env.DISABLE_RATE_LIMIT = 'true';
  });

  it('responde 429 después de superar el máximo de intentos', async () => {
    process.env.DISABLE_RATE_LIMIT = 'false';
    const app = express();
    app.use(makeLimiter({ windowMs: 60_000, max: 2, message: 'Demasiados intentos' }));
    app.get('/', (_req, res) => res.json({ ok: true }));

    await request(app).get('/');
    await request(app).get('/');
    const res = await request(app).get('/');

    expect(res.status).toBe(429);
    expect(res.body.error).toBe('Demasiados intentos');
  });

  it('no bloquea si DISABLE_RATE_LIMIT está activo', async () => {
    process.env.DISABLE_RATE_LIMIT = 'true';
    const app = express();
    app.use(makeLimiter({ windowMs: 60_000, max: 1, message: 'Demasiados intentos' }));
    app.get('/', (_req, res) => res.json({ ok: true }));

    await request(app).get('/');
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
  });
});
