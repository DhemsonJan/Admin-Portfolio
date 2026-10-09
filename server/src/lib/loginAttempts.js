import { getDb } from '../db/index.js';
import config from '../config/env.js';
import { nowIso } from '../lib/ids.js';

/**
 * Failed-login throttling backed by the `login_attempts` table, so limits are
 * shared across every process in a horizontally scaled deployment rather than
 * living in one process's memory.
 */
export function clientFingerprint(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip =
    (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : null) ||
    req.socket?.remoteAddress ||
    'unknown';
  const agent = String(req.headers['user-agent'] ?? '').slice(0, 120);
  return `${ip}|${agent}`;
}

export async function recordAttempt(fingerprint, success) {
  const db = await getDb();
  await db.run('INSERT INTO login_attempts (fingerprint, created_at, success) VALUES (?, ?, ?)', [
    fingerprint,
    nowIso(),
    success,
  ]);
}

export async function recentFailures(fingerprint) {
  const db = await getDb();
  const since = new Date(
    Date.now() - config.rateLimit.windowMinutes * 60 * 1000,
  ).toISOString();

  const row = await db.get(
    `SELECT COUNT(*) AS count, MAX(created_at) AS last_at
     FROM login_attempts
     WHERE fingerprint = ? AND success = ? AND created_at >= ?`,
    [fingerprint, 0, since],
  );

  const count = Number(row?.count ?? 0);
  const lastAt = row?.last_at ? new Date(row.last_at).getTime() : 0;
  const retryAfterMs = lastAt
    ? Math.max(0, lastAt + config.rateLimit.lockoutMinutes * 60 * 1000 - Date.now())
    : 0;

  return { count, retryAfterMs };
}

export async function clearAttempts(fingerprint) {
  const db = await getDb();
  await db.run('DELETE FROM login_attempts WHERE fingerprint = ?', [fingerprint]);
}