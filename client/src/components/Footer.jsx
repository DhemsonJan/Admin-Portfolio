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
            <a href={links.github} target="_blank" rel="noreferrer noopener" aria-label="GitHub">
              <Icon name="github" size={18} />
            </a>
            <a href={links.linkedin} target="_blank" rel="noreferrer noopener" aria-label="LinkedIn">
              <Icon name="linkedin" size={18} />
            </a>
            <a href={mailto} aria-label="Email">
              <Icon name="mail" size={18} />
            </a>
          </nav>
        </div>

        <div className="site-footer-bottom">
          <p>
            © {footer.year} {identity.fullName}. All rights reserved.
          </p>
          <p className="site-footer-location">{identity.location}</p>
        </div>
      </div>
    </footer>
  );
}