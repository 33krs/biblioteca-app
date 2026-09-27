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

describe('non-production startup mail configuration', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    mocks.getMailConfig.mockReturnValue({ mode: 'local' });
    mocks.listen.mockImplementation((_port: number, callback: () => void) => {
      callback();
      return { close: vi.fn() };
    });
  });

  it('allows test startup with the local mail adapter', async () => {
    vi.resetModules();
    await import('../src/index.js?phase3-local');

    expect(mocks.listen).toHaveBeenCalledTimes(1);
  });
});
