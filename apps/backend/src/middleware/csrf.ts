import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { sendError } from './errorResponse.js';

export const CSRF_COOKIE_NAME = 'biblioteca.csrf';
export const CSRF_HEADER_NAME = 'x-csrf-token';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function readCookie(req: Request, name: string): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  for (const entry of cookieHeader.split(';')) {
    const [rawName, ...rawValue] = entry.trim().split('=');
    if (rawName !== name) continue;

    try {
      return decodeURIComponent(rawValue.join('='));
    } catch {
      return null;
    }
  }

  return null;
}

export function createCsrfToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function requireCsrf(req: Request, res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) return next();

  const cookieToken = readCookie(req, CSRF_COOKIE_NAME);
  const headerToken = req.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken) {
    return sendError(res, 403, 'CSRF token missing or invalid', 'CSRF_INVALID');
  }

  const cookieBuffer = Buffer.from(cookieToken);
  const headerBuffer = Buffer.from(headerToken);
  if (
    cookieBuffer.length !== headerBuffer.length ||
    !crypto.timingSafeEqual(cookieBuffer, headerBuffer)
  ) {
    return sendError(res, 403, 'CSRF token missing or invalid', 'CSRF_INVALID');
  }

  next();
}
