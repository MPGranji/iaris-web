import { timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';
import { env } from '../config/env';
import { HttpError } from '../lib/http-error';

/** Protects admin endpoints with `Authorization: Bearer <ADMIN_TOKEN>`. */
export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (!env.adminToken) throw new HttpError(503, 'ADMIN_TOKEN is not configured');
  const header = req.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const a = Buffer.from(token);
  const b = Buffer.from(env.adminToken);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new HttpError(401, 'Unauthorized');
  next();
};
