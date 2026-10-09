import config from '../config/env.js';
import { readSession } from '../services/sessions.js';

/**
 * Gate for every /api/admin route. Nothing behind it is reachable without a
 * valid server-side session, regardless of what the client sends.
 */
export async function requireAuth(req, res, next) {
  const token = req.cookies?.[config.auth.cookieName];
  const session = await readSession(token);

  if (!session) {
    return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
  }

  req.session = session;
  req.sessionToken = token;
  return next();
}

/**
 * Blocks mutating requests from browser contexts that should never be able to
 * perform them. SameSite=strict already covers this, but a same-site
 * subdomain or a stale tab should not be enough on its own.
 */
export function requireSameOrigin(req, res, next) {
  const origin = req.headers.origin;
  if (!origin) return next();

  const allowed = config.clientOrigin;
  if (!allowed.includes(origin)) {
    return res.status(403).json({ error: 'Cross-origin request rejected.', code: 'BAD_ORIGIN' });
  }

  return next();
}