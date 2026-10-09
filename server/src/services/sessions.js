import { createHash } from 'node:crypto';
import { getDb } from '../db/index.js';
import config from '../config/env.js';
import { newToken, nowIso } from '../lib/ids.js';

/**
 * Server-side sessions.
 *
 * A random token is issued in an HTTP-only cookie. Only the SHA-256 digest of
 * that token is stored server-side, so a database leak cannot be replayed as a
 * live session.
 */

export const COOKIE_OPTIONS = () => ({
  httpOnly: true,
  secure: config.auth.cookieSecure,
  sameSite: 'strict',
  path: '/',
  maxAge: config.auth.sessionTtlHours * 60 * 60 * 1000,
});

const digest = (token) => createHash('sha256').update(token).digest('hex');

export async function createSession(userAgent = '') {
  const token = newToken();
  const createdAt = nowIso();
  const expiresAt = new Date(
    Date.now() + config.auth.sessionTtlHours * 60 * 60 * 1000,
  ).toISOString();

  const db = await getDb();
  await db.run(
    'INSERT INTO admin_sessions (id, created_at, expires_at, user_agent) VALUES (?, ?, ?, ?)',
    [digest(token), createdAt, expiresAt, String(userAgent ?? '').slice(0, 250)],
  );

  return { token, expiresAt };
}

export async function readSession(token) {
  if (!token || typeof token !== 'string') return null;

  const db = await getDb();
  const row = await db.get('SELECT * FROM admin_sessions WHERE id = ?', [digest(token)]);
  if (!row) return null;

  const expiresAt = new Date(row.expires_at);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
    await db.run('DELETE FROM admin_sessions WHERE id = ?', [row.id]);
    return null;
  }

  return { id: row.id, expiresAt: row.expires_at };
}

export async function destroySession(token) {
  if (!token) return;
  const db = await getDb();
  await db.run('DELETE FROM admin_sessions WHERE id = ?', [digest(token)]);
}

export async function destroyAllSessions() {
  const db = await getDb();
  await db.run('DELETE FROM admin_sessions');
}