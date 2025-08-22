import { randomUUID } from 'crypto';
import { NextFunction,Request, Response } from 'express';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export function addRequestId(req: Request, res: Response, next: NextFunction): void {
  // Generate unique request ID
  req.requestId = randomUUID();

  // Add request ID to response headers for client reference
  res.setHeader('X-Request-ID', req.requestId);

  // Add request ID to response locals for use in error handlers
  res.locals.requestId = req.requestId;

  next();
}

export function getRequestId(req: Request): string {
  return req.requestId || 'unknown';
}
