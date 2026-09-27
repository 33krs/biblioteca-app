import { randomUUID } from 'node:crypto';
import { Resend } from 'resend';
import { getMailConfig } from '../config/mail.js';

interface MailEnvironment {
  NODE_ENV?: string;
  RESEND_API_KEY?: string;
  MAIL_FROM?: string;
}

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
  env: MailEnvironment = process.env,
): Promise<void> {
  const config = getMailConfig(env);

  if (config.mode === 'local') {
    console.log(`[mailer] Reseteo de contraseña para ${email}: ${resetUrl}`);
    return;
  }

  try {
    const result = await new Resend(config.apiKey).emails.send({
      from: config.from,
      to: email,
      subject: 'Restablecimiento de contraseña',
      html: `<p>Usá el siguiente enlace para restablecer tu contraseña:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    });

    if (result.error) throw new Error('Resend email send failed');
  } catch (error) {
    console.error(`[mailer] password_reset_email_failed requestId=${randomUUID()}`);
    throw error;
  }
}
