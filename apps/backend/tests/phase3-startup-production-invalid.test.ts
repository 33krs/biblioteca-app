import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getMailConfig: vi.fn(),
  listen: vi.fn(),
  disconnect: vi.fn(),
}));

vi.mock('../src/app.js', () => ({
  createApp: () => ({ listen: mocks.listen }),
}));

vi.mock('../src/config/mail.js', () => ({ getMailConfig: mocks.getMailConfig }));
vi.mock('../src/prismaClient.js', () => ({ prisma: { $disconnect: mocks.disconnect } }));

describe('invalid production mail configuration', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'production';
    mocks.getMailConfig.mockImplementation(() => {
      throw new Error('invalid mail configuration');
    });
  });

  it('fails before the HTTP server starts', async () => {
    vi.resetModules();
    await expect(import('../src/index.js?phase3-production-invalid')).rejects.toThrow(
      'invalid mail configuration',
    );
    expect(mocks.listen).not.toHaveBeenCalled();
  });
});
