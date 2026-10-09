import { useId } from 'react';
import Icon from './Icon.jsx';

/**
 * Project artwork.
 *
 * Uses the real screenshot once one has been uploaded through the Project
 * Manager. Until then it renders a generated device mockup instead of a broken
 * image: the site stays presentable on a fresh install, and there is no dead
 * `<img>` to apologise for.
 *
 * The mockup is deliberately abstract — it suggests an interface without
 * pretending to be one, which keeps placeholder work from reading as claims.
 */
export default function ProjectVisual({
  src,
  alt,
  label = 'Project preview',
  ratio = '16 / 10',
  compact = false,
  className = '',
}) {
  const gradientId = useId();

  return (
    <div className={`project-visual ${compact ? 'is-compact' : ''} ${className}`.trim()} style={{ '--ratio': ratio }}>
      {src ? (
        <img className="project-visual-img" src={src} alt={alt || label} loading="lazy" decoding="async" />
      ) : (
        <div className="project-visual-mock" role="img" aria-label={`${label} — placeholder artwork`}>
          <svg className="project-visual-grid" width="100%" height="100%" aria-hidden="true">
            <defs>
              <linearGradient id={`${gradientId}-fill`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="rgba(56,189,248,0.16)" />
                <stop offset="55%" stopColor="rgba(99,102,241,0.08)" />
                <stop offset="100%" stopColor="rgba(15,23,42,0)" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${gradientId}-fill)`} />
          </svg>

          <div className="mock-window">
            <div className="mock-chrome">
              <span />
              <span />
              <span />
              <em>{label}</em>
            </div>
            <div className="mock-body">
              <div className="mock-sidebar">
                <i style={{ height: '38%' }} />
                <i style={{ height: '22%' }} />
                <i style={{ height: '30%' }} />
              </div>
              <div className="mock-main">
                <i className="mock-title" />
                <div className="mock-cards">
                  <i />
                  <i />
                  <i />
                </div>
                <i className="mock-chart" />
              </div>
            </div>
          </div>

          <span className="mock-badge">
            <Icon name="code" size={14} />
            Screenshot placeholder
          </span>
        </div>
      )}
      <div className="project-visual-sheen" aria-hidden="true" />
    </div>
  );
}