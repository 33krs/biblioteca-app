import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { createApp } from '../src/app.js';
import { prisma } from '../src/prismaClient.js';
import * as mailer from '../src/lib/mailer.js';

const app = createApp();

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('POST /api/auth/register', () => {
  it('crea una cuenta y devuelve un token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@test.com', password: 'password123', name: 'Ana' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user).toMatchObject({ email: 'a@test.com', name: 'Ana' });
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('rechaza contraseñas de menos de 8 caracteres', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@test.com', password: '1234567' });
    expect(res.status).toBe(400);
  });

  it('rechaza emails con formato inválido', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'no-es-un-email', password: 'password123' });
    expect(res.status).toBe(400);
  });

  it('rechaza un email ya registrado', async () => {
    await request(app).post('/api/auth/register').send({ email: 'a@test.com', password: 'password123' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@test.com', password: 'otraClave123' });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  it('devuelve un token con credenciales correctas', async () => {
    await request(app).post('/api/auth/register').send({ email: 'a@test.com', password: 'password123' });

    const res = await request(app).post('/api/auth/login').send({ email: 'a@test.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it('rechaza una contraseña incorrecta', async () => {
    await request(app).post('/api/auth/register').send({ email: 'a@test.com', password: 'password123' });

    const res = await request(app).post('/api/auth/login').send({ email: 'a@test.com', password: 'incorrecta' });

    expect(res.status).toBe(401);
  });

  it('rechaza un email no registrado', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nadie@test.com', password: 'password123' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('devuelve el usuario dueño del token', async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@test.com', password: 'password123' });

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${reg.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('a@test.com');
  });

  it('responde 401 sin token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('responde 401 con un token inválido', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer no-es-un-token');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/forgot-password', () => {
  it('genera un token de reseteo y "envía" el email si el usuario existe', async () => {
    await request(app).post('/api/auth/register').send({ email: 'a@test.com', password: 'password123' });
    const sendMock = vi.spyOn(mailer, 'sendPasswordResetEmail').mockResolvedValue();

    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'a@test.com' });

    expect(res.status).toBe(200);
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock.mock.calls[0][0]).toBe('a@test.com');
    expect(sendMock.mock.calls[0][1]).toContain('resetToken=');

    const user = await prisma.user.findUnique({ where: { email: 'a@test.com' } });
    expect(user?.resetTokenHash).toBeTruthy();
    expect(user?.resetTokenExpiresAt).toBeTruthy();
  });

  it('responde 200 igual si el email no existe, sin enviar nada', async () => {
    const sendMock = vi.spyOn(mailer, 'sendPasswordResetEmail').mockResolvedValue();

    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'nadie@test.com' });

    expect(res.status).toBe(200);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('rechaza un email con formato inválido', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'no-es-un-email' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/reset-password', () => {
  async function requestReset(email: string): Promise<string> {
    let capturedUrl = '';
    vi.spyOn(mailer, 'sendPasswordResetEmail').mockImplementation(async (_email, url) => {
      capturedUrl = url;
    });
    await request(app).post('/api/auth/forgot-password').send({ email });
    return new URL(capturedUrl).searchParams.get('resetToken')!;
  }

  it('cambia la contraseña con un token válido', async () => {
    await request(app).post('/api/auth/register').send({ email: 'a@test.com', password: 'password123' });
    const token = await requestReset('a@test.com');

    const res = await request(app).post('/api/auth/reset-password').send({ token, password: 'nuevaClave123' });
    expect(res.status).toBe(200);

    const login = await request(app).post('/api/auth/login').send({ email: 'a@test.com', password: 'nuevaClave123' });
    expect(login.status).toBe(200);
  });

  it('invalida el token después de usarlo', async () => {
    await request(app).post('/api/auth/register').send({ email: 'a@test.com', password: 'password123' });
    const token = await requestReset('a@test.com');

    await request(app).post('/api/auth/reset-password').send({ token, password: 'nuevaClave123' });
    const res = await request(app).post('/api/auth/reset-password').send({ token, password: 'otraClave456' });

    expect(res.status).toBe(400);
  });

  it('rechaza un token inexistente', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: crypto.randomBytes(32).toString('hex'), password: 'nuevaClave123' });
    expect(res.status).toBe(400);
  });

  it('rechaza una contraseña de menos de 8 caracteres', async () => {
    await request(app).post('/api/auth/register').send({ email: 'a@test.com', password: 'password123' });
    const token = await requestReset('a@test.com');

    const res = await request(app).post('/api/auth/reset-password').send({ token, password: 'corta' });
    expect(res.status).toBe(400);
  });
});
