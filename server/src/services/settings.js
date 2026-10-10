import { getDb } from '../db/index.js';

/**
 * Tiny key/value store (the `settings` table) for server-managed site options.
 * The only key today is the uploaded resume URL.
 */

const UPSERT =
  'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value';

export async function getSetting(key) {
  const db = await getDb();
  const row = await db.get('SELECT value FROM settings WHERE key = ?', [key]);
  return row?.value ?? '';
}

export async function setSetting(key, value) {
  const db = await getDb();
  await db.run(UPSERT, [key, value ?? '']);
}

export default { getSetting, setSetting };