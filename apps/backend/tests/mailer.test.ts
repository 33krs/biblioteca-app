import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getMailConfig } from '../src/config/mail.js';
import { sendPasswordResetEmail } from '../src/lib/mailer.js';

const sendMock = vi.fn();

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

describe('mail configuration', () => {
  it('requires Resend credentials in production', () => {
    expect(() =>
      getMailConfig({ NODE_ENV: 'production', RESEND_API_KEY: '', MAIL_FROM: '' }),
    ).toThrow('RESEND_API_KEY and MAIL_FROM are required in production');
  });

  it('uses the local adapter outside production without credentials', () => {
    expect(getMailConfig({ NODE_ENV: 'test' })).toEqual({ mode: 'local' });
  });
});

describe('sendPasswordResetEmail', () => {
  beforeEach(() => {
    sendMock.mockReset();
    vi.restoreAllMocks();
  });

  it('sends the reset URL through Resend in production', async () => {
    sendMock.mockResolvedValue({ data: { id: 'email-id' }, error: null });

    await sendPasswordResetEmail('ana@example.com', 'https://app.test/reset?resetToken=secret', {
      NODE_ENV: 'production',
      RESEND_API_KEY: 're_test_key',
      MAIL_FROM: 'Biblioteca <no-reply@example.com>',
    });

    expect(sendMock).toHaveBeenCalledWith({
      from: 'Biblioteca <no-reply@example.com>',
      to: 'ana@example.com',
      subject: 'Restablecimiento de contraseña',
      html: expect.stringContaining('https://app.test/reset?resetToken=secret'),
    });
  });

  it('keeps a local adapter without secrets outside production', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await sendPasswordResetEmail('ana@example.com', 'http://localhost/reset?resetToken=local', {
      NODE_ENV: 'development',
    });

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('http://localhost/reset?resetToken=local'));
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('logs only a request ID when the production provider fails', async () => {
    sendMock.mockRejectedValue(new Error('provider secret response'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(
      sendPasswordResetEmail('ana@example.com', 'https://app.test/reset?resetToken=secret', {
        NODE_ENV: 'production',
        RESEND_API_KEY: 're_live_key',
        MAIL_FROM: 'no-reply@example.com',
      }),
    ).rejects.toThrow('provider secret response');

    const logOutput = errorSpy.mock.calls.flat().join(' ');
    expect(logOutput).toContain('password_reset_email_failed');
    expect(logOutput).not.toContain('https://app.test/reset?resetToken=secret');
    expect(logOutput).not.toContain('secret');
    expect(logOutput).not.toContain('re_live_key');
    expect(logOutput).not.toContain('provider secret response');
  });
});
