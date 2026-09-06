import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

let token: string;

beforeEach(async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: 'owner@test.com', password: 'password123' });
  token = res.body.token;
});

function auth<T extends request.Test>(req: T): T {
  return req.set('Authorization', `Bearer ${token}`) as T;
}

describe('rutas de /api/shelf sin autenticación', () => {
  it('responden 401', async () => {
    const res = await request(app).get('/api/shelf');
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
  it('crea el libro y la relación con el usuario', async () => {
    const res = await auth(request(app).post('/api/shelf')).send({ title: 'Dune', author: 'Frank Herbert' });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('TO_READ');
    expect(res.body.book).toMatchObject({ title: 'Dune', author: 'Frank Herbert' });

    const shelf = await auth(request(app).get('/api/shelf'));
    expect(shelf.body).toHaveLength(1);
  });

  it('responde 400 si falta título o autor', async () => {
    const res = await auth(request(app).post('/api/shelf')).send({ title: 'Solo título' });
    expect(res.status).toBe(400);
  });

  it('es idempotente: añadir el mismo libro dos veces no lo duplica', async () => {
    await auth(request(app).post('/api/shelf')).send({ title: 'Dune', author: 'Frank Herbert' });
    const second = await auth(request(app).post('/api/shelf')).send({ title: 'Dune', author: 'Frank Herbert' });

    expect(second.status).toBe(201);

    const shelf = await auth(request(app).get('/api/shelf'));
    expect(shelf.body).toHaveLength(1);
  });

  it('dos usuarios distintos pueden tener el mismo libro en su estantería', async () => {
    await auth(request(app).post('/api/shelf')).send({ title: 'Dune', author: 'Frank Herbert' });

    const other = await request(app)
      .post('/api/auth/register')
      .send({ email: 'other@test.com', password: 'password123' });
    const res = await request(app)
      .post('/api/shelf')
      .set('Authorization', `Bearer ${other.body.token}`)
      .send({ title: 'Dune', author: 'Frank Herbert' });

    expect(res.status).toBe(201);
    expect(res.body.userId).toBe(other.body.user.id);
  });
});

describe('PATCH /api/shelf/:id', () => {
  it('actualiza estado, valoración, reseña y notas', async () => {
    const created = await auth(request(app).post('/api/shelf')).send({ title: 'Dune', author: 'Frank Herbert' });

    const res = await auth(request(app).patch(`/api/shelf/${created.body.id}`)).send({
      status: 'READ',
      rating: 5,
      review: 'Excelente',
      notes: 'Releer',
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'READ', rating: 5, review: 'Excelente', notes: 'Releer' });
  });

  it('responde 404 si el userBook es de otro usuario', async () => {
    const created = await auth(request(app).post('/api/shelf')).send({ title: 'Dune', author: 'Frank Herbert' });

    const other = await request(app)
      .post('/api/auth/register')
      .send({ email: 'other@test.com', password: 'password123' });

    const res = await request(app)
      .patch(`/api/shelf/${created.body.id}`)
      .set('Authorization', `Bearer ${other.body.token}`)
      .send({ status: 'READ' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/shelf/:id', () => {
  it('elimina el libro de la estantería', async () => {
    const created = await auth(request(app).post('/api/shelf')).send({ title: 'Dune', author: 'Frank Herbert' });

    const del = await auth(request(app).delete(`/api/shelf/${created.body.id}`));
    expect(del.status).toBe(204);

    const shelf = await auth(request(app).get('/api/shelf'));
    expect(shelf.body).toEqual([]);
  });

  it('responde 404 si el userBook es de otro usuario', async () => {
    const created = await auth(request(app).post('/api/shelf')).send({ title: 'Dune', author: 'Frank Herbert' });

    const other = await request(app)
      .post('/api/auth/register')
      .send({ email: 'other@test.com', password: 'password123' });

    const res = await request(app)
      .delete(`/api/shelf/${created.body.id}`)
      .set('Authorization', `Bearer ${other.body.token}`);

    expect(res.status).toBe(404);
  });
});
