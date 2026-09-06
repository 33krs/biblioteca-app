import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

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
