import type { Request, Response } from 'express';
import type { ErrorDetails } from '../lib/appError.js';
import { getRequestId } from './requestId.js';

export function sendError(
  res: Response,
  status: number,
  error: string,
  code: string,
  details?: ErrorDetails[],
) {
  return res.status(status).json({
    error,
    code,
    ...(details ? { details } : {}),
    requestId: getRequestId(res),
  });
}

export function logSafeEvent(
  level: 'error' | 'info',
  event: string,
  fields: Record<string, string | number>,
): void {
  const entry = JSON.stringify({ level, event, ...fields });
  if (level === 'error') console.error(entry);
  else console.info(entry);
}

export function logRequestError(
  req: Request,
  res: Response,
  status: number,
  code: string,
  fields: Record<string, string | number> = {},
): void {
  logSafeEvent('error', 'request_error', {
    requestId: getRequestId(res),
    method: req.method,
    path: req.path,
    status,
    code,
    ...fields,
  });
}
