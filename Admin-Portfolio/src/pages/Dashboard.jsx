import { Link } from 'react-router-dom';
import { useProjects } from './ProjectsProvider.jsx';
import { relativeTime, gradientFor, initials } from '../lib/format.js';
import { StatusBadge, FeaturedBadge } from '../components/StatusBadge.jsx';
import { LoadingBlock } from 'shared/components/Spinner.jsx';

const CARDS = [
  { key: 'total', label: 'TOTAL PROJECTS', accent: false },
  { key: 'published', label: 'PUBLISHED', accent: false },
  { key: 'drafts', label: 'DRAFTS', accent: false },
  { key: 'featured', label: 'FEATURED', accent: true },
];

export default function Dashboard() {
  const { projects, stats, loading, maxFeatured } = useProjects();

  const recent = [...projects]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5);

  return (
    <>
      <header className="admin-head">
        <div>
          <h1 className="admin-title">PROJECT MANAGER</h1>
          <p className="admin-subtitle">Manage the projects displayed on my portfolio.</p>
        </div>

        <div className="admin-head-actions">
          <Link className="btn btn-ghost" to="/admin/projects/list">
            Edit Projects
          </Link>
          <Link className="btn btn-primary" to="/admin/projects/new">
            + Upload Project
          </Link>
        </div>
      </header>

      <section className="stat-grid">
        {CARDS.map((card) => (
          <div
            className={`stat-card ${card.accent ? 'is-featured' : ''}`.trim()}
            key={card.key}
          >
            <div className="stat-label">{card.label}</div>
            <div className="stat-value">{stats[card.key]}</div>
            {card.key === 'featured' ? (
              <div className="field-hint" style={{ marginTop: '0.3rem' }}>
                max {maxFeatured}
              </div>
            ) : null}
          </div>
        ))}
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2 className="panel-title">Recently updated</h2>
          <Link className="btn btn-quiet btn-sm" to="/admin/projects/list">
            View all →
          </Link>
        </div>

        {loading ? (
          <LoadingBlock label="Loading projects…" />
        ) : recent.length === 0 ? (
          <div className="panel-body">
            <div className="empty" style={{ padding: '2.5rem 1rem' }}>
              <div className="empty-icon" aria-hidden="true">
                ◍
              </div>
              <h3>No projects yet</h3>
              <p className="muted">Add your first project to get started.</p>
              <Link className="btn btn-primary" to="/admin/projects/new">
                + Add Project
              </Link>
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Year</th>
                  <th>Updated</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((project) => (
                  <tr key={project.id}>
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
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        <StatusBadge status={project.status} />
                        {project.featured ? <FeaturedBadge /> : null}
                      </div>
                    </td>
                    <td className="mono faint">{project.year ?? '—'}</td>
                    <td className="faint" style={{ fontSize: '0.8rem' }}>
                      {relativeTime(project.updatedAt)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link className="btn btn-ghost btn-sm" to={`/admin/projects/edit/${project.id}`}>
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="field-hint" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        Changes appear on the public site immediately after you publish.
      </p>
    </>
  );
}