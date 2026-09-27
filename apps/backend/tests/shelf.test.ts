import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

let cookies: string[];
let csrfToken: string;

beforeEach(async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: 'owner@test.com', password: 'password123' });
  cookies = res.headers['set-cookie'];
  const csrfCookie = cookies.find((cookie) => cookie.startsWith('biblioteca.csrf='));
  if (!csrfCookie) throw new Error('CSRF cookie was not set');
  csrfToken = decodeURIComponent(csrfCookie.split(';', 1)[0].split('=').slice(1).join('='));
});

function auth<T extends request.Test>(req: T, csrf = false): T {
  req.set('Cookie', cookies);
  if (csrf) req.set('X-CSRF-Token', csrfToken);
  return req;
}

describe('rutas de /api/shelf sin autenticación', () => {
  it('responden 401', async () => {
    const res = await request(app).get('/api/shelf');
    expect(res.status).toBe(401);
  });

  it.each([
    ['POST', '/api/shelf'],
    ['PATCH', '/api/shelf/missing-id'],
    ['DELETE', '/api/shelf/missing-id'],
  ])('responde 401 para %s %s', async (method, path) => {
    const routeRequest =
      method === 'POST'
        ? request(app).post(path)
        : method === 'PATCH'
        ? request(app).patch(path)
        : request(app).delete(path);
    const res = await routeRequest;

    expect(res.status).toBe(401);
  });
});

describe('GET /api/shelf', () => {
  it('empieza vacío', async () => {
    const res = await auth(request(app).get('/api/shelf'));
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('POST /api/shelf', () => {
  it('rechaza solicitudes autenticadas sin token CSRF', async () => {
    const res = await auth(request(app).post('/api/shelf')).send({
      title: 'Dune',
      author: 'Frank Herbert',
    });
    expect(res.status).toBe(403);
  });

  it('crea el libro y la relación con el usuario', async () => {
    const res = await auth(request(app).post('/api/shelf'), true).send({
      title: 'Dune',
      author: 'Frank Herbert',
    });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('TO_READ');
    expect(res.body.book).toMatchObject({ title: 'Dune', author: 'Frank Herbert' });

    const shelf = await auth(request(app).get('/api/shelf'));
    expect(shelf.body).toHaveLength(1);
  });

  it('responde 400 si falta título o autor', async () => {
    const res = await auth(request(app).post('/api/shelf'), true).send({ title: 'Solo título' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('es idempotente: añadir el mismo libro dos veces no lo duplica', async () => {
    await auth(request(app).post('/api/shelf'), true).send({
      title: 'Dune',
      author: 'Frank Herbert',
    });
    const second = await auth(request(app).post('/api/shelf'), true).send({
      title: 'Dune',
      author: 'Frank Herbert',
    });

    expect(second.status).toBe(201);

    const shelf = await auth(request(app).get('/api/shelf'));
    expect(shelf.body).toHaveLength(1);
  });

  it('dos usuarios distintos pueden tener el mismo libro en su estantería', async () => {
    await auth(request(app).post('/api/shelf'), true).send({
      title: 'Dune',
      author: 'Frank Herbert',
    });

    const other = await request(app)
      .post('/api/auth/register')
      .send({ email: 'other@test.com', password: 'password123' });
    const res = await request(app)
      .post('/api/shelf')
      .set('Cookie', other.headers['set-cookie'])
      .set(
        'X-CSRF-Token',
        decodeURIComponent(
          other.headers['set-cookie']
            .find((cookie: string) => cookie.startsWith('biblioteca.csrf='))
            .split(';', 1)[0]
            .split('=')
            .slice(1)
            .join('='),
        ),
      )
      .send({ title: 'Dune', author: 'Frank Herbert' });

    expect(res.status).toBe(201);
    expect(res.body.userId).toBe(other.body.user.id);
  });
});

describe('PATCH /api/shelf/:id', () => {
  it('actualiza estado, valoración, reseña y notas', async () => {
    const created = await auth(request(app).post('/api/shelf'), true).send({
      title: 'Dune',
      author: 'Frank Herbert',
    });

    const res = await auth(request(app).patch(`/api/shelf/${created.body.id}`), true).send({
      status: 'READ',
      rating: 5,
      review: 'Excelente',
      notes: 'Releer',
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'READ',
      rating: 5,
      review: 'Excelente',
      notes: 'Releer',
    });
  });

  it('responde 404 si el userBook es de otro usuario', async () => {
    const created = await auth(request(app).post('/api/shelf'), true).send({
      title: 'Dune',
      author: 'Frank Herbert',
    });

    const other = await request(app)
      .post('/api/auth/register')
      .send({ email: 'other@test.com', password: 'password123' });

    const res = await request(app)
      .patch(`/api/shelf/${created.body.id}`)
      .set('Cookie', other.headers['set-cookie'])
      .set(
        'X-CSRF-Token',
        decodeURIComponent(
          other.headers['set-cookie']
            .find((cookie: string) => cookie.startsWith('biblioteca.csrf='))
            .split(';', 1)[0]
            .split('=')
            .slice(1)
            .join('='),
        ),
      )
      .send({ status: 'READ' });

    expect(res.status).toBe(404);
  });

  it('rechaza una valoración fuera del rango permitido', async () => {
    const created = await auth(request(app).post('/api/shelf'), true).send({
      title: 'Dune',
      author: 'Frank Herbert',
    });

    const res = await auth(request(app).patch(`/api/shelf/${created.body.id}`), true).send({
      rating: 6,
    });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.details).toEqual(expect.any(Array));
  });

  it('rechaza una actualización sin campos', async () => {
    const created = await auth(request(app).post('/api/shelf'), true).send({
      title: 'Dune',
      author: 'Frank Herbert',
    });

    const res = await auth(request(app).patch(`/api/shelf/${created.body.id}`), true).send({});

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('rechaza un estado de lectura desconocido', async () => {
    const created = await auth(request(app).post('/api/shelf'), true).send({
      title: 'Dune',
      author: 'Frank Herbert',
    });

    const res = await auth(request(app).patch(`/api/shelf/${created.body.id}`), true).send({
      status: 'UNKNOWN',
    });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});

describe('DELETE /api/shelf/:id', () => {
  it('elimina el libro de la estantería', async () => {
    const created = await auth(request(app).post('/api/shelf'), true).send({
      title: 'Dune',
      author: 'Frank Herbert',
    });

    const del = await auth(request(app).delete(`/api/shelf/${created.body.id}`), true);
    expect(del.status).toBe(204);

    const shelf = await auth(request(app).get('/api/shelf'));
    expect(shelf.body).toEqual([]);
  });

  it('responde 404 si el userBook es de otro usuario', async () => {
    const created = await auth(request(app).post('/api/shelf'), true).send({
      title: 'Dune',
      author: 'Frank Herbert',
    });

    const other = await request(app)
      .post('/api/auth/register')
      .send({ email: 'other@test.com', password: 'password123' });

    const otherCookies = other.headers['set-cookie'];
    const otherCsrfCookie = otherCookies.find((cookie: string) =>
      cookie.startsWith('biblioteca.csrf='),
    );
    if (!otherCsrfCookie) throw new Error('CSRF cookie was not set');
    const otherCsrfToken = decodeURIComponent(
      otherCsrfCookie.split(';', 1)[0].split('=').slice(1).join('='),
    );
    const res = await request(app)
      .delete(`/api/shelf/${created.body.id}`)
      .set('Cookie', otherCookies)
      .set('X-CSRF-Token', otherCsrfToken);

    expect(res.status).toBe(404);
  });
});
