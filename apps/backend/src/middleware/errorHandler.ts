import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/appError.js';
import { logRequestError, sendError } from './errorResponse.js';

export function asyncHandler(handler: RequestHandler): RequestHandler {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  void _next;
  if (error instanceof AppError) {
    logRequestError(req, res, error.statusCode, error.code);
    return sendError(res, error.statusCode, error.message, error.code, error.details);
  }

  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => ({
      field: issue.path.join('.') || 'request',
      message: issue.message,
    }));
    logRequestError(req, res, 400, 'VALIDATION_ERROR');
    return sendError(res, 400, 'Solicitud inválida', 'VALIDATION_ERROR', details);
  }

  logRequestError(req, res, 500, 'INTERNAL_ERROR');
  return sendError(res, 500, 'Error interno del servidor', 'INTERNAL_ERROR');
};
