import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('GET /api/shelf', () => {
  it('empieza vacío', async () => {
    const res = await request(app).get('/api/shelf');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('POST /api/shelf', () => {
  it('crea el libro y la relación con el usuario', async () => {
    const res = await request(app)
      .post('/api/shelf')
      .send({ title: 'Dune', author: 'Frank Herbert' });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('TO_READ');
    expect(res.body.book).toMatchObject({ title: 'Dune', author: 'Frank Herbert' });

    const shelf = await request(app).get('/api/shelf');
    expect(shelf.body).toHaveLength(1);
  });

  it('responde 400 si falta título o autor', async () => {
    const res = await request(app).post('/api/shelf').send({ title: 'Solo título' });
    expect(res.status).toBe(400);
  });

  it('es idempotente: añadir el mismo libro dos veces no lo duplica', async () => {
    await request(app).post('/api/shelf').send({ title: 'Dune', author: 'Frank Herbert' });
    const second = await request(app)
      .post('/api/shelf')
      .send({ title: 'Dune', author: 'Frank Herbert' });

    expect(second.status).toBe(201);

    const shelf = await request(app).get('/api/shelf');
    expect(shelf.body).toHaveLength(1);
  });
});

describe('PATCH /api/shelf/:id', () => {
  it('actualiza estado, valoración, reseña y notas', async () => {
    const created = await request(app)
      .post('/api/shelf')
      .send({ title: 'Dune', author: 'Frank Herbert' });

    const res = await request(app)
      .patch(`/api/shelf/${created.body.id}`)
      .send({ status: 'READ', rating: 5, review: 'Excelente', notes: 'Releer' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'READ',
      rating: 5,
      review: 'Excelente',
      notes: 'Releer',
    });
  });
});

describe('DELETE /api/shelf/:id', () => {
  it('elimina el libro de la estantería', async () => {
    const created = await request(app)
      .post('/api/shelf')
      .send({ title: 'Dune', author: 'Frank Herbert' });

    const del = await request(app).delete(`/api/shelf/${created.body.id}`);
    expect(del.status).toBe(204);

    const shelf = await request(app).get('/api/shelf');
    expect(shelf.body).toEqual([]);
  });
});
