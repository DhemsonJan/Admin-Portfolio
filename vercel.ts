/**
 * Vercel configuration for the whole monorepo.
 *
 * One repo feeds two Vercel projects, and they must not build the
 * same thing:
 *
 * - dhemsonjan-portfolio  — the public portfolio at / plus the
 *   Project Manager at /admin/ (the default, and what a local
 *   `vercel deploy` from the repo root produces).
 * - admin-portfolio       — the Project Manager as its own site at
 *   /, with its own /api function so the login cookie stays
 *   same-origin.
 *
 * The admin project sets DEPLOY_TARGET=admin (Project Settings →
 * Environment Variables, plus `--build-env DEPLOY_TARGET=admin` on
 * CLI deploys). vercel.ts is evaluated at build time, so that one
 * variable picks the configuration below. Anything else — including
 * every Git deployment of the public project — gets the default
 * branch.
 *
 * This file replaces vercel.json (only one configuration file per
 * project is allowed). The default branch is the old vercel.json
 * verbatim, so the public deployment behaves exactly as before.
 */

const isAdmin = process.env.DEPLOY_TARGET === 'admin';

export const config = isAdmin
  ? {
      framework: null,
      // NODE_ENV=production is set on this project, and npm
      // treats that as "skip devDependencies" — but this build
      // needs Vite. --include=dev forces the dev dependencies
      // back in.
      installCommand: 'npm install --no-audit --no-fund --include=dev',
      // Build the Project Manager standalone. ADMIN_STANDALONE=true
      // comes from the project's environment variables and tells
      // Admin-Portfolio/vite.config.js to emit its own dist at /
      // instead of the /admin/ slice of client/dist.
      buildCommand: 'npm run build:admin:standalone',
      outputDirectory: 'Admin-Portfolio/dist',
      functions: {
        'api/index.js': {
          memory: 1024,
          maxDuration: 30,
        },
      },
      // API rewritten to the serverless function, everything else
      // falls back to index.html for the /admin/projects SPA
      // routes.
      rewrites: [
        { source: '/api/:path*', destination: '/api/index' },
        { source: '/(.*)', destination: '/index.html' },
      ],
    }
  : {
      framework: null,
      installCommand: 'npm install --no-audit --no-fund',
      // Prebuilt client/dist is uploaded from the local machine,
      // so the build step is a no-op. The admin app is built into
      // client/dist/admin and served under /admin/.
      buildCommand: 'echo "build skipped: prebuilt dist is served from client/dist"',
      outputDirectory: 'client/dist',
      functions: {
        'api/index.js': {
          memory: 1024,
          maxDuration: 30,
        },
      },
      rewrites: [
        { source: '/api/:path*', destination: '/api/index' },
        { source: '/admin/:path*', destination: '/admin/index.html' },
        { source: '/(.*)', destination: '/index.html' },
      ],
    };
