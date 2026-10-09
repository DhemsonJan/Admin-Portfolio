import express from 'express';
import config from '../config/env.js';
import { verifyPin, hasPinConfigured } from '../lib/pin.js';
import {
  clearAttempts,
  clientFingerprint,
  recentFailures,
  recordAttempt,
} from '../lib/loginAttempts.js';
import { COOKIE_OPTIONS, createSession, destroyAllSessions, destroySession } from '../services/sessions.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncRoute, HttpError } from '../middleware/errors.js';
import { validateLogin } from '../lib/validate.js';

const router = express.Router();

const GENERIC_FAILURE = 'Incorrect PIN.';

router.get(
  '/session',
  asyncRoute(async (req, res) => {
    const { readSession } = await import('../services/sessions.js');
    const token = req.cookies?.[config.auth.cookieName];
    const session = await readSession(token);
    res.json({ authenticated: Boolean(session), expiresAt: session?.expiresAt ?? null });
  }),
);

router.post(
  '/login',
  asyncRoute(async (req, res) => {
    if (!hasPinConfigured()) {
      throw new HttpError(
        503,
        'Admin PIN is not configured on the server.',
        'PIN_NOT_CONFIGURED',
      );
    }

    const fingerprint = clientFingerprint(req);
    const { count, retryAfterMs } = await recentFailures(fingerprint);

    if (count >= config.rateLimit.maxAttempts && retryAfterMs > 0) {
      const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
      res.set('Retry-After', String(retryAfterSeconds));
      return res.status(429).json({
        error: `Too many incorrect attempts. Try again in ${Math.ceil(
          retryAfterSeconds / 60,
        )} minute(s).`,
        code: 'RATE_LIMITED',
        retryAfterSeconds,
      });
    }

    const { pin } = validateLogin(req.body ?? {});
    const ok = await verifyPin(pin);

    if (!ok) {
      await recordAttempt(fingerprint, false);
      return res.status(401).json({ error: GENERIC_FAILURE, code: 'INVALID_PIN' });
    }

    await clearAttempts(fingerprint);
    const { token, expiresAt } = await createSession(req.headers['user-agent']);

    res.cookie(config.auth.cookieName, token, COOKIE_OPTIONS());
    return res.json({ ok: true, expiresAt });
  }),
);

router.post(
  '/logout',
  asyncRoute(async (req, res) => {
    await destroySession(req.cookies?.[config.auth.cookieName]);
    res.clearCookie(config.auth.cookieName, { ...COOKIE_OPTIONS(), maxAge: undefined });
    res.json({ ok: true });
  }),
);

router.post(
  '/logout-all',
  requireAuth,
  asyncRoute(async (req, res) => {
    await destroyAllSessions();
    res.clearCookie(config.auth.cookieName, { ...COOKIE_OPTIONS(), maxAge: undefined });
    res.json({ ok: true });
  }),
);

export default router;