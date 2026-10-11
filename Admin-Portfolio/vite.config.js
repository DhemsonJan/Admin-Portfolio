import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Two build shapes from this one app:
 *
 * - Default: the /admin/ slice of the dashboard's dist, so one
 *   deployment serves the dashboard at / and this app at /admin/.
 * - Standalone (ADMIN_STANDALONE=true): the Project Manager as its own
 *   site at / — used by the admin-portfolio Vercel project, which
 *   deploys this app on its own domain with its own /api function.
 *
 * The URL shape stays /admin/projects in both, so links and the
 * session cookie behave identically.
 */
const standalone = process.env.ADMIN_STANDALONE === 'true';

export default defineConfig({
  plugins: [react()],

  // Served under /admin/ in development and production, so the URL shape is
  // identical in both (e.g. /admin/projects). The standalone build keeps
  // the same shape at the root of its own domain.
  base: standalone ? '/' : '/admin/',

  resolve: {
    alias: {
      // Everything shared with the dashboard lives in client/src — one source
      // of truth, so the admin site stays connected to the dashboard code.
      shared: fileURLToPath(new URL('../client/src', import.meta.url)),
    },
  },

  server: {
    port: 5174,
    strictPort: true,
    fs: {
      // The shared alias reads from ../client/src.
      allow: [fileURLToPath(new URL('..', import.meta.url))],
    },
    proxy: {
      // Same-origin in development so the SameSite=Strict session cookie
      // behaves exactly as it will in production.
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },

  build: {
    // Default: emitted inside the dashboard's dist so one deployment
    // serves both apps — the dashboard at / and this app at /admin/.
    // Standalone: this app's own dist, served at the root of the
    // admin-portfolio deployment.
    outDir: standalone ? 'dist' : '../client/dist/admin',
    emptyOutDir: true,
    sourcemap: false,
  },
});
