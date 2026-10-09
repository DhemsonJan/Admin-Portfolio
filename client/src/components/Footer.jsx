import { footer, identity, links, mailto } from '../site.js';
import Icon from '../components/Icon.jsx';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="site-footer-top">
          <div>
            <p className="site-footer-name">{footer.name}</p>
            <p className="site-footer-tagline">{footer.tagline}</p>
          </div>

          <nav className="site-footer-links" aria-label="Social">
            <a href={links.github} target="_blank" rel="noreferrer noopener" aria-label="GitHub · @DhemsonJan">
              <Icon name="github" size={18} />
            </a>
            <a href={links.githubAlt} target="_blank" rel="noreferrer noopener" aria-label="GitHub · @dhemsonjanpilapiltubod-creator">
              <Icon name="github" size={18} />
            </a>
            <a href={links.linkedin} target="_blank" rel="noreferrer noopener" aria-label="LinkedIn">
              <Icon name="linkedin" size={18} />
            </a>
            <a href={mailto} aria-label="Email · Gmail">
              <Icon name="gmail" size={18} />
            </a>
          </nav>
        </div>

        <div className="site-footer-bottom">
          <p>
            © {footer.year} {identity.fullName}. Crafted with care.
          </p>
          <div className="site-footer-meta">
            <p className="site-footer-location">{identity.location}</p>
            <a href="#home" className="site-footer-top-link">
              <span>Back to top</span>
              <Icon name="arrowUp" size={15} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}