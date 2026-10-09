import { ensureReady } from '../server/src/bootstrap.js';
import { createApp } from '../server/src/app.js';

/**
 * Vercel serverless entry point.
 *
 * Vercel imports this module and calls the default export per request. There is
 * no boot hook, so the database connection and schema migration happen inside the
 * handler via ensureReady(), which caches itself for warm invocations.
 *
 * SERVE_CLIENT is false in the Vercel environment: Vercel serves client/dist
 * as static output directly, so the function only ever answers /api.
 */
const app = createApp();

export default async function handler(req, res) {
  await ensureReady();
  return app(req, res);
}
