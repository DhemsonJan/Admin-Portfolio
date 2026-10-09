import path from 'node:path';
import fs from 'node:fs';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import config from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import contactRoutes from './routes/contact.routes.js';
import projectRoutes from './routes/projects.routes.js';
import adminProjectRoutes from './routes/projects.admin.routes.js';
import uploadRoutes from './routes/uploads.routes.js';
import resumeUploadRoutes from './routes/uploads.resume.routes.js';
import { errorHandler, notFound } from './middleware/errors.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // Never let a proxy or the browser cache authenticated API responses.
  app.use((_req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.set('X-Frame-Options', 'DENY');
    next();
  });

  /**
   * CORS applies to API calls only. Static assets are same-origin by
   * definition, and Vite marks its <script>/<link> tags `crossorigin`, which
   * makes the browser attach an Origin header even to same-origin requests —
   * rejecting those would break the app.
   *
   * Disallowed origins get no CORS headers rather than a 500, so the browser
   * blocks the call cleanly instead of logging a server error.
   */
  const corsForRequest = (req, callback) => {
    const origin = req.headers.origin;
    const options = { credentials: true, origin: false };

    if (!origin) return callback(null, options);

    if (config.clientOrigin.includes(origin)) {
      return callback(null, { ...options, origin: true });
    }

    // Same-origin requests (app served by this same process).
    const host = req.headers['x-forwarded-host'] ?? req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] ?? 'http';

    if (host && origin === `${protocol}://${host}`) {
      return callback(null, { ...options, origin: true });
    }

    return callback(null, options);
  };

  app.use('/api', cors(corsForRequest));

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));
  app.use(cookieParser());

  // Dev-only fingerprint of the storage driver, handy when checking config.
  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      env: config.nodeEnv,
      database: config.db.client,
      storage: config.storage.driver,
      // Lets you confirm a public deployment really has the admin surface off.
      admin: config.exposeAdmin ? 'mounted' : 'disabled',
    });
  });

  app.use('/api/contact', contactRoutes);
  app.use('/api', projectRoutes);

  /**
   * Admin surface. Mounted only when EXPOSE_ADMIN is set, so the public
   * deployment has no /api/auth/login and no write endpoints at all — the
   * Project Manager runs from your own machine against the same database.
   */
  if (config.exposeAdmin) {
    app.use('/api/auth', authRoutes);
    app.use('/api', adminProjectRoutes);
    app.use('/api', uploadRoutes);
    app.use('/api', resumeUploadRoutes);
  }

  // Static uploads. Disabled automatically when a cloud storage driver is used.
  if (config.storage.driver === 'local' && fs.existsSync(config.storage.uploadDir)) {
    app.use(
      config.storage.publicUploadPath,
      express.static(config.storage.uploadDir, {
        maxAge: '7d',
        index: false,
        dotfiles: 'deny',
        setHeaders(res) {
          res.set('X-Content-Type-Options', 'nosniff');
        },
      }),
    );
  }

  // Serve the built client if it exists, so `npm run build && npm start`
  // gives a single-origin production setup. The admin app builds into
  // client/dist/admin and is served under /admin/.
  const clientDist = path.resolve(config.serverRoot, '..', 'client', 'dist');
  const adminDist = path.join(clientDist, 'admin');
  const adminIndex = path.join(adminDist, 'index.html');
  if (config.serveClient && fs.existsSync(clientDist)) {
    app.use(express.static(clientDist, { index: false, maxAge: '1h' }));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith(config.storage.publicUploadPath)) {
        return next();
      }
      if (req.path.startsWith('/admin') && fs.existsSync(adminIndex)) {
        return res.sendFile(adminIndex);
      }
      return res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export default createApp;