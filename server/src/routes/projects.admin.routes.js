import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncRoute, HttpError } from '../middleware/errors.js';
import { ValidationError, validateProject } from '../lib/validate.js';
import { uniqueSlug } from '../lib/slug.js';
import { removeAssets } from '../storage/index.js';
import {
  createProject,
  deleteProject,
  findById,
  listAll,
  reorderProjects,
  setFeatured,
  setStatus,
  stats,
  takeAllSlugs,
  updateProject,
} from '../services/projects.js';

/**
 * Every mutating project route, mounted at /api so the public paths stay
 * /api/admin/... exactly as before.
 *
 * This lives apart from projects.routes.js so a public-only deployment can skip
 * the import entirely: app.js mounts this router only when EXPOSE_ADMIN is set.
 * Keeping them in one file would have forced a conditional around the whole
 * admin block, which would have pulled the login surface along with it.
 */
const router = express.Router();

/** Keep the featured row small enough that it still means something. */
const MAX_FEATURED = 3;

router.use('/admin', requireAuth);

router.get(
  '/admin/stats',
  asyncRoute(async (_req, res) => {
    res.json({ stats: await stats(), maxFeatured: MAX_FEATURED });
  }),
);

router.get(
  '/admin/projects',
  asyncRoute(async (_req, res) => {
    res.json({ projects: await listAll() });
  }),
);

router.get(
  '/admin/projects/:id',
  asyncRoute(async (req, res) => {
    const project = await findById(req.params.id);
    if (!project) throw new HttpError(404, 'Project not found.', 'NOT_FOUND');
    res.json({ project });
  }),
);

router.post(
  '/admin/projects',
  asyncRoute(async (req, res) => {
    const data = validateProject(req.body ?? {});
    data.slug = uniqueSlug(data.title, await takeAllSlugs());

    if (data.featured) {
      const { featured } = await stats();
      if (featured >= MAX_FEATURED) {
        throw new ValidationError(
          `Only ${MAX_FEATURED} projects can be featured. Unfeature one first.`,
          { featured: `Limit of ${MAX_FEATURED} reached.` },
        );
      }
    }

    const project = await createProject(data);
    res.status(201).json({ project, message: 'Project created.' });
  }),
);

router.patch(
  '/admin/projects/:id',
  asyncRoute(async (req, res) => {
    const existing = await findById(req.params.id);
    if (!existing) throw new HttpError(404, 'Project not found.', 'NOT_FOUND');

    const patch = validateProject(req.body ?? {}, { partial: true });

    if (patch.title && patch.title !== existing.title) {
      const taken = await takeAllSlugs();
      taken.delete(existing.slug);
      patch.slug = uniqueSlug(patch.title, taken);
    }

    if (patch.featured === true && !existing.featured) {
      const { featured } = await stats();
      if (featured >= MAX_FEATURED) {
        throw new ValidationError(
          `Only ${MAX_FEATURED} projects can be featured. Unfeature one first.`,
          { featured: `Limit of ${MAX_FEATURED} reached.` },
        );
      }
    }

    const project = await updateProject(req.params.id, patch);
    res.json({ project, message: 'Project updated.' });
  }),
);

router.post(
  '/admin/projects/:id/status',
  asyncRoute(async (req, res) => {
    const { status } = req.body ?? {};
    if (status !== 'draft' && status !== 'published') {
      throw new ValidationError('Status must be draft or published.', { status: 'Invalid value.' });
    }
    if (!(await findById(req.params.id))) {
      throw new HttpError(404, 'Project not found.', 'NOT_FOUND');
    }

    const project = await setStatus(req.params.id, status);
    res.json({
      project,
      message: status === 'published' ? 'Project published.' : 'Project unpublished.',
    });
  }),
);

router.post(
  '/admin/projects/:id/feature',
  asyncRoute(async (req, res) => {
    if (!(await findById(req.params.id))) {
      throw new HttpError(404, 'Project not found.', 'NOT_FOUND');
    }

    const featured = req.body?.featured === true || req.body?.featured === 'true';

    if (featured) {
      const { featured: current } = await stats();
      if (current >= MAX_FEATURED) {
        throw new ValidationError(
          `Only ${MAX_FEATURED} projects can be featured. Unfeature one first.`,
          { featured: `Limit of ${MAX_FEATURED} reached.` },
        );
      }
    }

    const project = await setFeatured(req.params.id, featured);
    res.json({ project, message: featured ? 'Project featured.' : 'Feature removed.' });
  }),
);

router.post(
  '/admin/projects/reorder',
  asyncRoute(async (req, res) => {
    const ids = req.body?.ids;
    if (!Array.isArray(ids) || ids.length === 0 || ids.some((id) => typeof id !== 'string')) {
      throw new ValidationError('Send the ordered list of project ids.', { ids: 'Invalid.' });
    }

    const projects = await reorderProjects(ids);
    res.json({ projects, message: 'Display order saved.' });
  }),
);

router.delete(
  '/admin/projects/:id',
  asyncRoute(async (req, res) => {
    const project = await findById(req.params.id);
    if (!project) throw new HttpError(404, 'Project not found.', 'NOT_FOUND');

    await deleteProject(req.params.id);
    await removeAssets([project.thumbnailUrl, ...project.gallery]);

    res.json({ ok: true, message: `“${project.title}” deleted.` });
  }),
);

export default router;
