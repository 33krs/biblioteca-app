const PRODUCTION = 'production';

export const MAIL_MODE = {
  LOCAL: 'local',
  RESEND: 'resend',
} as const;

export type MailMode = (typeof MAIL_MODE)[keyof typeof MAIL_MODE];

export interface LocalMailConfig {
  mode: typeof MAIL_MODE.LOCAL;
}

export interface ResendMailConfig {
  mode: typeof MAIL_MODE.RESEND;
  apiKey: string;
  from: string;
}

export type MailConfig = LocalMailConfig | ResendMailConfig;

interface MailEnvironment {
  NODE_ENV?: string;
  RESEND_API_KEY?: string;
  MAIL_FROM?: string;
}

export function getMailConfig(env: MailEnvironment = process.env): MailConfig {
  if (env.NODE_ENV !== PRODUCTION) return { mode: MAIL_MODE.LOCAL };

  const apiKey = env.RESEND_API_KEY?.trim();
  const from = env.MAIL_FROM?.trim();
  if (!apiKey || !from) {
    throw new Error('RESEND_API_KEY and MAIL_FROM are required in production');
  }

  return { mode: MAIL_MODE.RESEND, apiKey, from };
}
