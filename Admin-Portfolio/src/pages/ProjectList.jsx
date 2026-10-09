import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from 'shared/lib/api.js';
import { useProjects } from './ProjectsProvider.jsx';
import { useToast } from 'shared/components/Toast.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import ProjectExternalLinks from 'shared/components/ProjectExternalLinks.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { LoadingBlock } from 'shared/components/Spinner.jsx';
import { gradientFor, initials, relativeTime } from '../lib/format.js';

const SORTS = [
  { key: 'manual', label: 'Custom order' },
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'title', label: 'Title A–Z' },
];

/**
 * Edit Projects page: search, filter, sort, drag-and-drop ordering, and the
 * per-row actions (edit, preview, publish, feature, delete).
 */
export default function ProjectList() {
  const { projects, loading, refresh, upsert, patchLocal, remove, stats, maxFeatured } =
    useProjects();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('manual');
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [preview, setPreview] = useState(null);

  const dragCounter = useRef(0);

  const categories = useMemo(() => {
    const set = new Set(projects.flatMap((project) => project.categories ?? []));
    return [...set].sort();
  }, [projects]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();

    let list = projects.filter((project) => {
      if (category !== 'all' && !(project.categories ?? []).includes(category)) return false;
      if (!term) return true;

      const haystack = [
        project.title,
        project.shortDescription,
        project.role,
        ...(project.technologies ?? []),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(term);
    });

    if (sort === 'newest') {
      list = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sort === 'oldest') {
      list = [...list].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sort === 'title') {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    }

    return list;
  }, [projects, search, category, sort]);

  const toggleStatus = async (project) => {
    const next = project.status === 'published' ? 'draft' : 'published';
    setBusyId(project.id);
    try {
      const result = await api.admin.setStatus(project.id, next);
      upsert(result.project);
      toast.success(result.message);
    } catch (error) {
      toast.fromError(error, 'Could not change the status.');
    } finally {
      setBusyId(null);
    }
  };

  const toggleFeatured = async (project) => {
    const next = !project.featured;
    setBusyId(project.id);
    try {
      const result = await api.admin.setFeatured(project.id, next);
      upsert(result.project);
      toast.success(result.message);
    } catch (error) {
      toast.fromError(error, 'Could not update the featured flag.');
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const result = await api.admin.remove(pendingDelete.id);
      remove(pendingDelete.id);
      setPendingDelete(null);
      toast.success(result.message ?? 'Project deleted.');
    } catch (error) {
      toast.fromError(error, 'Could not delete the project.');
    } finally {
      setDeleting(false);
      refresh();
    }
  };

  /* ------------------------------------------------------------ drag & drop */

  const onDragStart = (id) => (event) => {
    setDragId(id);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', id);
  };

  const onDragEnter = (id) => (event) => {
    event.preventDefault();
    dragCounter.current += 1;
    setOverId(id);
  };

  const onDragLeave = (id) => (event) => {
    event.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setOverId((current) => (current === id ? null : current));
    }
  };

  const onDrop = (targetId) => async (event) => {
    event.preventDefault();
    dragCounter.current = 0;

    const sourceId = dragId ?? event.dataTransfer.getData('text/plain');
    setOverId(null);
    setDragId(null);

    if (!sourceId || sourceId === targetId) return;

    const ids = projects.map((project) => project.id);
    const from = ids.indexOf(sourceId);
    const to = ids.indexOf(targetId);
    if (from === -1 || to === -1) return;

    const next = [...ids];
    next.splice(to, 0, ...next.splice(from, 1));

    // Optimistic reorder, then persist.
    const order = new Map(next.map((id, index) => [id, index]));
    projects.forEach((project) => patchLocal(project.id, { sortOrder: order.get(project.id) }));

    try {
      const result = await api.admin.reorder(next);
      upsertMany(result.projects);
      toast.success('Display order saved.');
    } catch (error) {
      toast.fromError(error, 'Could not save the new order.');
      refresh();
    }
  };

  const upsertMany = (list) => {
    for (const project of list) upsert(project);
  };

  const featuredAtLimit = stats.featured >= maxFeatured;

  return (
    <>
      <header className="admin-head">
        <div>
          <h1 className="admin-title">Edit Projects</h1>
          <p className="admin-subtitle">
            {projects.length} project{projects.length === 1 ? '' : 's'} · drag the handle to change
            the order they appear on your site.
          </p>
        </div>

        <div className="admin-head-actions">
          <Link className="btn btn-ghost" to="/admin/projects">
            Dashboard
          </Link>
          <Link className="btn btn-primary" to="/admin/projects/new">
            + Upload Project
          </Link>
        </div>
      </header>

      <div className="toolbar">
        <div className="search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            className="input"
            type="search"
            placeholder="Search projects…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search projects"
          />
        </div>

        <select
          className="select"
          style={{ width: 'auto', minWidth: 170 }}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          aria-label="Filter by category"
        >
          <option value="all">All categories</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          className="select"
          style={{ width: 'auto', minWidth: 150 }}
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          aria-label="Sort projects"
        >
          {SORTS.map((item) => (
            <option key={item.key} value={item.key}>
              Sort: {item.label}
            </option>
          ))}
        </select>
      </div>

      <section className="panel">
        {loading ? (
          <LoadingBlock label="Loading projects…" />
        ) : visible.length === 0 ? (
          <div className="panel-body">
            <div className="empty" style={{ padding: '2.5rem 1rem' }}>
              <div className="empty-icon" aria-hidden="true">
                ⌕
              </div>
              <h3>Nothing matches</h3>
              <p className="muted">
                {projects.length === 0
                  ? 'You have not added any projects yet.'
                  : 'Try a different search or filter.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 34 }} aria-label="Reorder" />
                  <th>Project</th>
                  <th>Status</th>
                  <th>Category</th>
                  <th>Year</th>
                  <th>Updated</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {visible.map((project) => (
                  <tr
                    key={project.id}
                    className={`${dragId === project.id ? 'is-dragging' : ''} ${
                      overId === project.id && dragId !== project.id ? 'is-drop-target' : ''
                    }`.trim()}
                    draggable={sort === 'manual'}
                    onDragStart={onDragStart(project.id)}
                    onDragEnter={onDragEnter(project.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDragLeave={onDragLeave(project.id)}
                    onDrop={onDrop(project.id)}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverId(null);
                      dragCounter.current = 0;
                    }}
                  >
                    <td>
                      <span
                        className="drag-handle"
                        title={sort === 'manual' ? 'Drag to reorder' : 'Set sorting to Custom order to reorder'}
                        aria-hidden="true"
                        style={{ opacity: sort === 'manual' ? 1 : 0.35 }}
                      >
                        ⠿
                      </span>
                    </td>

                    <td>
                      <div className="table-title">
                        {project.thumbnailUrl ? (
                          <img className="table-thumb" src={project.thumbnailUrl} alt="" />
                        ) : (
                          <div
                            className="table-thumb table-thumb-fallback"
                            style={{ background: gradientFor(project.slug) }}
                            aria-hidden="true"
                          >
                            {initials(project.title)}
                          </div>
                        )}
                        <div>
                          <div className="table-name">{project.title}</div>
                          <div className="table-slug">/{project.slug}</div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <StatusBadge status={project.status} />
                    </td>

                    <td className="faint" style={{ fontSize: '0.82rem' }}>
                      {(project.categories ?? [project.category]).join(', ')}
                    </td>

                    <td className="mono faint">{project.year ?? '—'}</td>

                    <td className="faint" style={{ fontSize: '0.8rem' }}>
                      {relativeTime(project.updatedAt)}
                    </td>

                    <td>
                      <div className="row-actions">
                        <Link
                          className="icon-btn"
                          to={`/admin/projects/edit/${project.id}`}
                          title="Edit"
                          aria-label={`Edit ${project.title}`}
                        >
                          ✎
                        </Link>

                        <button
                          type="button"
                          className="icon-btn"
                          title="Preview"
                          aria-label={`Preview ${project.title}`}
                          onClick={() => setPreview(project)}
                        >
                          ◉
                        </button>

                        <button
                          type="button"
                          className="icon-btn"
                          title={project.status === 'published' ? 'Unpublish' : 'Publish'}
                          aria-label={
                            project.status === 'published'
                              ? `Unpublish ${project.title}`
                              : `Publish ${project.title}`
                          }
                          disabled={busyId === project.id}
                          onClick={() => toggleStatus(project)}
                        >
                          {project.status === 'published' ? '◉' : '○'}
                        </button>

                        <button
                          type="button"
                          className={`icon-btn ${project.featured ? 'is-active' : ''}`.trim()}
                          title={
                            project.featured
                              ? 'Remove featured'
                              : featuredAtLimit
                                ? `Limit of ${maxFeatured} featured reached`
                                : 'Mark as featured'
                          }
                          aria-label={`Toggle featured for ${project.title}`}
                          disabled={busyId === project.id || (!project.featured && featuredAtLimit)}
                          onClick={() => toggleFeatured(project)}
                        >
                          ★
                        </button>

                        <button
                          type="button"
                          className="icon-btn danger"
                          title="Delete"
                          aria-label={`Delete ${project.title}`}
                          onClick={() => setPendingDelete(project)}
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {sort !== 'manual' ? (
              <p className="filter-note">
                Switch sorting to “Custom order” to drag projects into place.
              </p>
            ) : null}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this project?"
        message={`“${pendingDelete?.title ?? ''}” will be permanently removed, along with its uploaded images. This cannot be undone.`}
        confirmLabel="Delete Project"
        busy={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />

      {preview ? (
        <div className="preview-shell" role="dialog" aria-modal="true" aria-label="Project preview">
          <div className="preview-bar">
            <div>
              <div className="preview-label">Preview · not saved</div>
              <div style={{ fontSize: '0.88rem', marginTop: '0.15rem' }}>{preview.title}</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link className="btn btn-ghost btn-sm" to={`/admin/projects/edit/${preview.id}`}>
                Edit
              </Link>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setPreview(null)}
              >
                Close
              </button>
            </div>
          </div>
          <PreviewBody project={preview} />
        </div>
      ) : null}
    </>
  );
}

/** Mirrors the public case-study layout without needing a save. */
function PreviewBody({ project }) {
  return (
    <div style={{ padding: '2rem 0 4rem' }}>
      <div className="container">
        <span className="eyebrow">Preview</span>
        <div className="tag-list" style={{ marginBottom: '1rem' }}>
          {(project.categories ?? [project.category]).map((item) => (
            <span className="tag" key={item}>
              {item}
            </span>
          ))}
        </div>

        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', maxWidth: '22ch' }}>
          {project.title}
        </h1>

        {project.shortDescription ? (
          <p className="lede" style={{ marginTop: '1rem' }}>
            {project.shortDescription}
          </p>
        ) : null}

        {/* Same GitHub / globe icon links the public site uses. */}
        <div className="detail-actions" style={{ marginTop: '1.25rem' }}>
          <ProjectExternalLinks
            githubUrl={project.githubUrl}
            websiteUrl={project.websiteUrl ?? project.demoUrl}
          />
        </div>

        <div className="detail-hero-image">
          {project.thumbnailUrl ? (
            <img src={project.thumbnailUrl} alt="" />
          ) : (
            <div
              className="project-media-fallback"
              style={{
                position: 'absolute',
                inset: 0,
                background: gradientFor(project.slug),
                fontSize: '4rem',
              }}
              aria-hidden="true"
            >
              {initials(project.title)}
            </div>
          )}
        </div>

        <div className="detail-grid">
          <div className="detail-main">
            {project.fullDescription ? <p>{project.fullDescription}</p> : null}

            {project.keyFeatures?.length > 0 ? (
              <>
                <h2>Key features</h2>
                <ul className="feature-list">
                  {project.keyFeatures.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </>
            ) : null}

            {project.technologies?.length > 0 ? (
              <>
                <h2>Technology stack</h2>
                <div className="tag-list">
                  {project.technologies.map((tech) => (
                    <span className="tag" key={tech}>
                      {tech}
                    </span>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          <aside className="detail-aside">
            <div className="fact">
              <span className="fact-label">Role</span>
              <span className="fact-value">{project.role || '—'}</span>
            </div>
            <div className="fact">
              <span className="fact-label">Year</span>
              <span className="fact-value">{project.year ?? '—'}</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}