import Icon from './Icon.jsx';

/**
 * External project links.
 *
 * Uses the official GitHub mark and a globe for the live site, and renders
 * nothing at all when a URL is missing so visitors never see a dead button.
 * Every link opens in a new tab with `rel="noopener noreferrer"`.
 */

const META = {
  github: { icon: 'github', label: 'GitHub', tip: 'View source code on GitHub' },
  live: { icon: 'globe', label: 'Live Website', tip: 'Visit live website' },
};

/**
 * Icon-only external link with a hover tooltip. Used on project cards, where a
 * large text button would dominate the layout.
 */
export function ExternalLinkIcon({ href, kind = 'live', className = '', size = 17 }) {
  const meta = META[kind];
  if (!href || !meta) return null;

  return (
    <a
      className={`icon-link ${className}`.trim()}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={meta.tip}
      aria-label={meta.tip}
      data-tip={meta.tip}
    >
      <Icon name={meta.icon} size={size} />
    </a>
  );
}

/**
 * Text + icon variant, used on the project detail page where there is room for
 * labelled actions.
 */
export function ExternalLinkButton({ href, kind = 'live', className = 'btn btn-ghost', size = 17 }) {
  const meta = META[kind];
  if (!href || !meta) return null;

  return (
    <a
      className={className}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={meta.tip}
    >
      <Icon name={meta.icon} size={size} />
      {meta.label}
    </a>
  );
}

/**
 * Convenience wrapper: both project links at once, each rendered only if set.
 */
export default function ProjectExternalLinks({
  githubUrl,
  websiteUrl,
  demoUrl,
  variant = 'icon',
  className = '',
  size,
}) {
  // `websiteUrl` is the field the upload form writes; `demoUrl` is the original
  // name still used by older records, so accept either.
  const live = websiteUrl ?? demoUrl ?? null;
  const Component = variant === 'button' ? ExternalLinkButton : ExternalLinkIcon;

  return (
    <>
      <Component href={githubUrl} kind="github" className={className} size={size} />
      <Component href={live} kind="live" className={className} size={size} />
    </>
  );
}