import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));

vi.mock('../src/prismaClient.js', () => ({
  prisma: {
    user: {
      findUnique: mocks.findUnique,
      update: mocks.update,
    },
  },
}));

vi.mock('../src/lib/mailer.js', () => ({
  sendPasswordResetEmail: mocks.sendPasswordResetEmail,
}));

const app = createApp();
const existingUser = {
  id: 'user-1',
  email: 'exists@example.com',
  name: null,
  passwordHash: 'hash',
  resetTokenHash: null,
  resetTokenExpiresAt: null,
  sessionVersion: 0,
};

beforeEach(() => {
  vi.restoreAllMocks();
  mocks.findUnique.mockImplementation(({ where }: { where: { email?: string } }) =>
    Promise.resolve(where.email === existingUser.email ? existingUser : null),
  );
  mocks.update.mockResolvedValue(existingUser);
  mocks.sendPasswordResetEmail.mockResolvedValue(undefined);
});

describe('POST /api/auth/forgot-password', () => {
  it('returns the same public response for existing and missing accounts', async () => {
    const existing = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: existingUser.email });
    const missing = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'missing@example.com' });

    expect(existing.status).toBe(200);
    expect(missing.status).toBe(existing.status);
    expect(missing.body).toEqual(existing.body);
  });

  it('returns the same public response when the mail provider fails', async () => {
    const normal = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'missing@example.com' });
    mocks.sendPasswordResetEmail.mockRejectedValueOnce(
      new Error('provider secret PROVIDER_KEY resetToken=token-from-provider https://secret.example'),
    );

    const failed = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: existingUser.email });

    expect(failed.status).toBe(normal.status);
    expect(failed.body).toEqual(normal.body);
    expect(JSON.stringify(failed.body)).not.toContain('PROVIDER_KEY');
    expect(JSON.stringify(failed.body)).not.toContain('token-from-provider');
    expect(JSON.stringify(failed.body)).not.toContain('https://secret.example');
  });

  it('logs only a request id when the mail provider fails', async () => {
    const error = new Error('provider secret PROVIDER_KEY resetToken=token-from-provider https://secret.example');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.sendPasswordResetEmail.mockRejectedValueOnce(error);

    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: existingUser.email });

    const output = errorSpy.mock.calls.flat().map(String).join(' ');
    expect(output).toMatch(/requestId=[0-9a-f-]{36}/);
    expect(output).not.toContain('PROVIDER_KEY');
    expect(output).not.toContain('token-from-provider');
    expect(output).not.toContain('https://secret.example');
  });
});
