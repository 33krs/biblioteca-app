import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../prismaClient.js';
import { readCookie } from './csrf.js';

export const SESSION_COOKIE_NAME = 'biblioteca.session';
export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface AuthedRequest extends Request {
  userId?: string;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('Falta JWT_SECRET en las variables de entorno');
  return secret;
}

export function signToken(userId: string, sessionVersion: number): string {
  return jwt.sign({ sub: userId, sv: sessionVersion }, getJwtSecret(), { expiresIn: '7d' });
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = readCookie(req, SESSION_COOKIE_NAME);
  if (!token) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  try {
    const payload = jwt.verify(token, getJwtSecret()) as jwt.JwtPayload;
    if (typeof payload.sub !== 'string' || !Number.isInteger(payload.sv)) {
      throw new Error('Invalid session payload');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { sessionVersion: true },
    });
    if (!user || user.sessionVersion !== payload.sv) throw new Error('Session revoked');

    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
