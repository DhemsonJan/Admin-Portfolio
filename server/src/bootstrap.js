import config from './config/env.js';
import { initDb } from './db/index.js';
import { migrate, purgeExpiredSessions } from './db/schema.js';
import { initStorage } from './storage/index.js';

/**
 * One-time process setup, safe to call on every request.
 *
 * The long-running server used to do this once in main() before app.listen(),
 * which cannot work on serverless: there is no boot hook, only the handler. A
 * Vercel function is handed a request on a cold start and has to bring the
 * database and storage up first.
 *
 * The promise is cached in module scope so warm invocations pay nothing, and it
 * is cleared on failure so a transient outage does not permanently poison a
 * warm lambda — the next request retries the connection instead of inheriting
 * a rejected promise forever.
 */
let ready = null;

export function ensureReady() {
  if (!ready) {
    ready = (async () => {
      if (config.storage.allowedTypes.length === 0) {
        throw new Error(
          'ALLOWED_IMAGE_TYPES resolved to an empty list, which would block every upload. ' +
            'Set it in server/.env, e.g. ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp',
        );
      }

      const db = await initDb(config);
      await migrate();
      console.log(`[db] driver: ${db.kind}`);

      await initStorage();

      // Opportunistic cleanup; never let it break startup.
      purgeExpiredSessions().catch((error) => {
        console.warn('[db] session purge skipped:', error.message);
      });

      return db;
    })().catch((error) => {
      ready = null;
      throw error;
    });
  }

  return ready;
}

export default ensureReady;
