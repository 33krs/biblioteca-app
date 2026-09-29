import { randomUUID } from 'node:crypto';
import type { RequestHandler, Response } from 'express';

const REQUEST_ID_HEADER = 'X-Request-ID';
const REQUEST_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const requestId: RequestHandler = (req, res, next) => {
  const incoming = req.get(REQUEST_ID_HEADER);
  const id = incoming && REQUEST_ID_PATTERN.test(incoming) ? incoming : randomUUID();

  res.locals.requestId = id;
  res.setHeader(REQUEST_ID_HEADER, id);
  next();
};

export function getRequestId(res: Response): string {
  const id = res.locals.requestId;
  return typeof id === 'string' ? id : randomUUID();
}
