import express from 'express';
import { asyncRoute, HttpError } from '../middleware/errors.js';
import { catalog } from '../lib/validate.js';
import { findBySlug, listPublished } from '../services/projects.js';

/**
 * Public, read-only project endpoints.
 *
 * Mutating routes live in projects.admin.routes.js, which is mounted only when
 * EXPOSE_ADMIN is set. Nothing in this file depends on a session, so the public
 * deployment serves visitors without ever loading the auth or PIN code.
 */
const router = express.Router();

/**
 * Portfolio content is edited from the admin UI, so a cached copy can contradict
 * what the owner just published. These responses must never be served stale.
 *
 * `max-age=0, must-revalidate` still lets browsers and CDNs store the response,
 * but forces a conditional request every time. Express already emits a strong
 * ETag, so an unchanged payload costs a bodyless 304 rather than a full reply.
 */
const PUBLIC_CACHE_CONTROL = 'public, max-age=0, must-revalidate';

router.get(
  '/projects',
  asyncRoute(async (_req, res) => {
    res.set('Cache-Control', PUBLIC_CACHE_CONTROL);
    res.json({ projects: await listPublished() });
  }),
);

router.get(
  '/projects/:slug',
  asyncRoute(async (req, res) => {
    const project = await findBySlug(req.params.slug);

    // Drafts and anything unpublished are indistinguishable from "not found"
    // for anonymous visitors.
    if (!project || project.status !== 'published') {
      throw new HttpError(404, 'Project not found.', 'NOT_FOUND');
    }

    res.set('Cache-Control', PUBLIC_CACHE_CONTROL);
    res.json({ project });
  }),
);

router.get('/meta', (_req, res) => {
  res.json(catalog);
});

export default router;
