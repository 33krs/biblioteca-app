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

describe('production startup mail validation', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'production';
    mocks.getMailConfig.mockImplementation(() => ({
      mode: 'resend',
      apiKey: 'test-key',
      from: 'test@example.com',
    }));
    mocks.listen.mockImplementation((_port: number, callback: () => void) => {
      callback();
      return { close: vi.fn() };
    });
  });

  it('invokes getMailConfig before listening', async () => {
    const order: string[] = [];
    mocks.getMailConfig.mockImplementation(() => {
      order.push('getMailConfig');
      return { mode: 'resend', apiKey: 'test-key', from: 'test@example.com' };
    });
    mocks.listen.mockImplementation((_port: number, callback: () => void) => {
      order.push('listen');
      callback();
      return { close: vi.fn() };
    });

    vi.resetModules();
    await import('../src/index.js?phase3-production-valid');

    expect(mocks.getMailConfig).toHaveBeenCalledTimes(1);
    expect(order).toEqual(['getMailConfig', 'listen']);
  });
});
