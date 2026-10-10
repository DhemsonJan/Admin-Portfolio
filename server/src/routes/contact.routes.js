import express from 'express';
import config from '../config/env.js';
import { getDb } from '../db/index.js';
import { newId, nowIso } from '../lib/ids.js';
import { clientFingerprint } from '../lib/loginAttempts.js';
import { asyncRoute, HttpError } from '../middleware/errors.js';
import { ValidationError } from '../lib/validate.js';
import { sendContactEmail } from '../services/mailer.js';

/**
 * Public contact form.
 *
 * Every message is validated and stored in `contact_messages`. When mail
 * credentials are configured (see `config.mail`), the message is also emailed
 * straight to the owner's inbox so nothing waits on someone opening a CMS.
 *
 * Throttling reuses `login_attempts` so limits stay consistent across processes
 * in a horizontally scaled deployment instead of living in one process's memory.
 */

const router = express.Router();

const MAX = { name: 80, email: 200, message: 4000 };
const WINDOW_MINUTES = 30;
const MAX_PER_WINDOW = 5;

// Deliberately permissive but still a real shape check.
const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

const clean = (value) => (typeof value === 'string' ? value.trim() : '');

export function validateContact(body = {}) {
  const errors = {};
  const name = clean(body.name);
  const email = clean(body.email);
  const message = clean(body.message);

  // Honeypot: a hidden field only a bot fills in. Accept silently so the bot
  // does not learn it was detected, but never store anything.
  if (clean(body.company)) return { spam: true };

  if (!name) errors.name = 'Please enter your name.';
  else if (name.length > MAX.name) errors.name = `Maximum ${MAX.name} characters.`;

  if (!email) errors.email = 'Please enter your email address.';
  else if (email.length > MAX.email || !EMAIL.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!message) errors.message = 'Please enter a message.';
  else if (message.length > MAX.message) errors.message = `Maximum ${MAX.message} characters.`;

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Please fix the highlighted fields.', errors);
  }

  return { name, email, message };
}

async function recentMessages(fingerprint) {
  const db = await getDb();
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
  const row = await db.get(
    `SELECT COUNT(*) AS count FROM login_attempts
     WHERE fingerprint = ? AND success = FALSE AND created_at >= ?`,
    [fingerprint, since],
  );
  return Number(row?.count ?? 0);
}

async function recordMessage(fingerprint) {
  const db = await getDb();
  await db.run('INSERT INTO login_attempts (fingerprint, created_at, success) VALUES (?, ?, ?)', [
    fingerprint,
    nowIso(),
    false,
  ]);
}

router.post(
  '/',
  asyncRoute(async (req, res) => {
    const fingerprint = `contact:${clientFingerprint(req)}`;

    if ((await recentMessages(fingerprint)) >= MAX_PER_WINDOW) {
      throw new HttpError(
        429,
        `You have sent several messages recently. Please try again in ${WINDOW_MINUTES} minutes.`,
        'RATE_LIMITED',
      );
    }

    const data = validateContact(req.body ?? {});

    // Honeypot hit: report success without storing.
    if (data.spam) {
      return res.status(201).json({ ok: true, message: 'Thanks — your message was sent.' });
    }

    const db = await getDb();
    const id = newId();
    await db.run(
      'INSERT INTO contact_messages (id, name, email, message, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, data.name, data.email, data.message, 'new', nowIso()],
    );

    // Best-effort email to the owner's inbox. Failure must not lose the
    // visitor's message, so the store above always wins and email only
    // downgrades the success note.
    const emailed = await sendContactEmail(data);

    await recordMessage(fingerprint);

    res.status(201).json({
      ok: true,
      emailed,
      message: emailed
        ? 'Thanks — your message was sent. I will get back to you soon.'
        : 'Thanks — your message was received. I will get back to you soon.',
    });
  }),
);

/** Lets the client show the remaining budget without leaking anything else. */
router.get(
  '/status',
  asyncRoute(async (req, res) => {
    const fingerprint = `contact:${clientFingerprint(req)}`;
    const used = await recentMessages(fingerprint);
    res.json({ remaining: Math.max(0, MAX_PER_WINDOW - used) });
  }),
);

export { MAX_PER_WINDOW, WINDOW_MINUTES, config };
export default router;