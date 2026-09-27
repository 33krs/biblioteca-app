import { Router, type Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../prismaClient.js';
import {
  requireAuth,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_MS,
  signToken,
  type AuthedRequest,
} from '../middleware/auth.js';
import { createCsrfToken, CSRF_COOKIE_NAME, requireCsrf } from '../middleware/csrf.js';
import { sendPasswordResetEmail } from '../lib/mailer.js';
import { authLimiter, loginLimiter, forgotPasswordLimiter } from '../middleware/rateLimit.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody } from '../middleware/validate.js';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '../schemas/auth.js';

const router = Router();

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function isValidEmail(email: unknown): email is string {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function toPublicUser(user: { id: string; email: string; name: string | null }) {
  return { id: user.id, email: user.email, name: user.name };
}

function cookieOptions(httpOnly: boolean) {
  return {
    httpOnly,
    maxAge: SESSION_MAX_AGE_MS,
    path: '/api',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  };
}

function establishSession(res: Response, user: { id: string; sessionVersion: number }) {
  res.cookie(SESSION_COOKIE_NAME, signToken(user.id, user.sessionVersion), cookieOptions(true));
  res.cookie(CSRF_COOKIE_NAME, createCsrfToken(), cookieOptions(false));
}

function clearSession(res: Response) {
  const options = {
    path: '/api',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  };
  res.clearCookie(SESSION_COOKIE_NAME, { ...options, httpOnly: true });
  res.clearCookie(CSRF_COOKIE_NAME, { ...options, httpOnly: false });
}

// POST /api/auth/register - crea una cuenta y establece una sesión por cookie
router.post(
  '/register',
  authLimiter,
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const { email, password, name } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese email' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: typeof name === 'string' && name.trim() ? name.trim() : null,
      },
    });

    establishSession(res, user);
    res.status(201).json({ user: toPublicUser(user) });
  }),
);

// POST /api/auth/login - valida credenciales y establece una sesión por cookie
router.post(
  '/login',
  loginLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    establishSession(res, user);
    res.json({ user: toPublicUser(user) });
  }),
);

// POST /api/auth/forgot-password - genera un token de reseteo y lo "envía"
// por email. Siempre responde 200 con el mismo mensaje exista o no la cuenta,
// para no revelar qué emails están registrados.
router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  validateBody(forgotPasswordSchema),
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    const genericResponse = {
      message: 'Si el email existe, te enviamos instrucciones para reestablecer la contraseña',
    };

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetTokenHash: hashResetToken(token),
          resetTokenExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const resetUrl = `${frontendUrl}/?resetToken=${token}`;
      try {
        await sendPasswordResetEmail(user.email, resetUrl);
      } catch {
        console.error(`password_reset_email_failed requestId=${crypto.randomUUID()}`);
      }
    }

    res.json(genericResponse);
  }),
);

// POST /api/auth/reset-password - consume el token del email y define una
// contraseña nueva.
router.post(
  '/reset-password',
  authLimiter,
  validateBody(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    const { token, password } = req.body;

    if (typeof token !== 'string' || !token) {
      return res.status(400).json({ error: 'Falta el token de reseteo' });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    const user = await prisma.user.findUnique({ where: { resetTokenHash: hashResetToken(token) } });
    if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
      return res.status(400).json({ error: 'El link de reseteo es inválido o expiró' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetTokenHash: null,
        resetTokenExpiresAt: null,
        sessionVersion: { increment: 1 },
      },
    });

    res.json({ message: 'Contraseña actualizada' });
  }),
);

router.post('/logout', requireAuth, requireCsrf, (_req, res) => {
  clearSession(res);
  res.status(204).end();
});

// GET /api/auth/me - devuelve el usuario del token, para rehidratar sesión
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ user: toPublicUser(user) });
  }),
);

export default router;
