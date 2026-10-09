import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { ExternalLinkButton } from '../components/ProjectExternalLinks.jsx';
import ProjectVisual from '../components/ProjectVisual.jsx';
import Footer from '../components/Footer.jsx';
import { LoadingBlock } from '../components/Spinner.jsx';
import { identity } from '../site.js';
import api from '../lib/api.js';

/**
 * Full case study for a single project.
 *
 * The layout mirrors the public site so a visitor arriving on a deep link sees
 * the same design language as someone who navigated from the home page.
 */
export default function ProjectDetail() {
  const { slug } = useParams();
  const [project, setProject] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');

    api
      .getPublicProject(slug, controller.signal)
      .then((result) => {
        setProject(result.project);
        setStatus('ready');
        document.title = `${result.project.title} — ${identity.fullName}`;
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        // Unpublished projects are indistinguishable from missing ones.
        setStatus(error.status === 404 ? 'missing' : 'error');
        document.title = `Project not found — ${identity.fullName}`;
      });

    return () => {
      controller.abort();
      document.title = `${identity.fullName} — ${identity.roleLine}`;
    };
  }, [slug]);

  if (status === 'loading') {
    return (
      <div className="page-loading">
        <LoadingBlock label="Loading project…" />
      </div>
    );
  }

  if (status !== 'ready' || !project) {
    return (
      <div className="page-loading">
        <div className="detail-missing">
          <h1>{status === 'missing' ? 'Project not found' : 'Something went wrong'}</h1>
          <p>This project may be unpublished or the link may be incorrect.</p>
          <Link className="btn btn-primary" to="/">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const paragraphs = project.fullDescription
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const blocks = [
    { label: 'The problem', body: project.problem },
    { label: 'The solution', body: project.solution },
    { label: 'My contribution', body: project.contribution },
  ];

  return (
    <>
      <div className="detail-nav">
        <Link className="detail-back" to="/">
          <Icon name="arrow" size={16} className="icon-flip" />
          Back to portfolio
        </Link>
      </div>

      <main id="main" className="detail">
        <div className="wrap">
          <header className="detail-head">
            <p className="detail-kicker">{project.categories.join(' · ')}</p>
            <h1 className="detail-title">{project.title}</h1>
            {project.shortDescription && (
              <p className="detail-subtitle">{project.shortDescription}</p>
            )}

            <dl className="detail-facts">
              {project.role && (
                <div>
                  <dt>Role</dt>
                  <dd>{project.role}</dd>
                </div>
              )}
              {project.year && (
                <div>
                  <dt>Year</dt>
                  <dd>{project.year}</dd>
                </div>
              )}
              <div>
                <dt>Status</dt>
                <dd>{project.status === 'published' ? 'Published' : 'Draft'}</dd>
              </div>
            </dl>

            <div className="detail-actions">
              {/* Each action is omitted entirely when its URL is not set. */}
              <ExternalLinkButton
                href={project.githubUrl}
                kind="github"
              />
              <ExternalLinkButton
                href={project.websiteUrl ?? project.demoUrl}
                kind="live"
              />
            </div>
          </header>

          <ProjectVisual
            src={project.thumbnailUrl}
            alt={`${project.title} preview`}
            label={project.title}
            ratio="16 / 9"
            className="detail-visual"
          />

          {project.technologies.length > 0 && (
            <ul className="tag-list detail-tags" aria-label="Technologies used">
              {project.technologies.map((tech) => (
                <li className="tag" key={tech}>
                  {tech}
                </li>
              ))}
            </ul>
          )}

          <div className="detail-layout">
            <div className="detail-main">
              {paragraphs.length > 0 && (
                <section className="detail-section">
                  <h2>Overview</h2>
                  {paragraphs.map((paragraph, index) => (
                    <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                  ))}
                </section>
              )}

              {blocks.map((block) =>
                block.body ? (
                  <section className="detail-section" key={block.label}>
                    <h2>{block.label}</h2>
                    <p>{block.body}</p>
                  </section>
                ) : null,
              )}

              {project.gallery.length > 0 && (
                <section className="detail-section">
                  <h2>Gallery</h2>
                  <div className="detail-gallery">
                    {project.gallery.map((image) => (
                      <img key={image} src={image} alt={`${project.title} screenshot`} loading="lazy" />
                    ))}
                  </div>
                </section>
              )}
            </div>

            <aside className="detail-aside">
              {project.keyFeatures.length > 0 && (
                <div className="detail-aside-block">
                  <h2>Key features</h2>
                  <ul className="feature-list">
                    {project.keyFeatures.map((feature) => (
                      <li key={feature}>
                        <Icon name="check" size={15} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {project.technologies.length > 0 && (
                <div className="detail-aside-block">
                  <h2>Built with</h2>
                  <ul className="detail-aside-tags">
                    {project.technologies.map((tech) => (
                      <li key={tech}>{tech}</li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}