import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // Served under /admin/ in development and production, so the URL shape is
  // identical in both (e.g. /admin/projects).
  base: '/admin/',

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
    // Emitted inside the dashboard's dist so one deployment serves both apps:
    // the dashboard at / and this app at /admin/.
    outDir: '../client/dist/admin',
    emptyOutDir: true,
    sourcemap: false,
  },
});
