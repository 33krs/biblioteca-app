import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/appError.js';
import { logRequestError, sendError } from './errorResponse.js';

const ERROR_TYPE = {
  ERROR: 'Error',
  EVAL: 'EvalError',
  RANGE: 'RangeError',
  REFERENCE: 'ReferenceError',
  SYNTAX: 'SyntaxError',
  TYPE: 'TypeError',
  URI: 'URIError',
  UNKNOWN: 'UnknownError',
} as const;

type ErrorType = (typeof ERROR_TYPE)[keyof typeof ERROR_TYPE];

function classifyErrorType(error: unknown): ErrorType {
  if (error instanceof TypeError) return ERROR_TYPE.TYPE;
  if (error instanceof RangeError) return ERROR_TYPE.RANGE;
  if (error instanceof SyntaxError) return ERROR_TYPE.SYNTAX;
  if (error instanceof ReferenceError) return ERROR_TYPE.REFERENCE;
  if (error instanceof URIError) return ERROR_TYPE.URI;
  if (error instanceof EvalError) return ERROR_TYPE.EVAL;
  if (error instanceof Error) return ERROR_TYPE.ERROR;
  return ERROR_TYPE.UNKNOWN;
}

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

  logRequestError(req, res, 500, 'INTERNAL_ERROR', {
    errorType: classifyErrorType(error),
  });
  return sendError(res, 500, 'Error interno del servidor', 'INTERNAL_ERROR');
};
