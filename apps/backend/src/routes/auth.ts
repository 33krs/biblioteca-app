import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prismaClient.js';
import { requireAuth, signToken, type AuthedRequest } from '../middleware/auth.js';

const router = Router();

function isValidEmail(email: unknown): email is string {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function toPublicUser(user: { id: string; email: string; name: string | null }) {
  return { id: user.id, email: user.email, name: user.name };
}

// POST /api/auth/register - crea una cuenta y devuelve un token
router.post('/register', async (req, res) => {
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

  res.status(201).json({ token: signToken(user.id), user: toPublicUser(user) });
});

// POST /api/auth/login - valida credenciales y devuelve un token
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Email o contraseña incorrectos' });
  }

  res.json({ token: signToken(user.id), user: toPublicUser(user) });
});

// GET /api/auth/me - devuelve el usuario del token, para rehidratar sesión
router.get('/me', requireAuth, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ user: toPublicUser(user) });
});

export default router;
