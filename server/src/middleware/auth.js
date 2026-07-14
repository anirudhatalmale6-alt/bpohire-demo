import jwt from 'jsonwebtoken';
import { HttpError } from './error.js';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role, companyId: user.companyId }, SECRET, { expiresIn: '7d' });

export function authenticate(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new HttpError(401, 'Authentication required.'));
  try {
    const payload = jwt.verify(token, SECRET);
    req.user = { id: payload.sub, role: payload.role, companyId: payload.companyId };
    next();
  } catch {
    next(new HttpError(401, 'Invalid or expired token.'));
  }
}

export const requireRole =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return next(new HttpError(403, 'Not allowed.'));
    next();
  };

// Attaches req.user when a token is present, but does not reject anonymous callers.
export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return next();
  try {
    const payload = jwt.verify(header.slice(7), SECRET);
    req.user = { id: payload.sub, role: payload.role, companyId: payload.companyId };
  } catch {
    /* ignore a bad token on public endpoints */
  }
  next();
}
