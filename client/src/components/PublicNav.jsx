import { useCallback, useEffect, useRef, useState } from 'react';
import { identity, nav } from '../site.js';
import Icon from './Icon.jsx';

/**
 * Sticky site navigation.
 *
 * Three behaviours worth noting:
 *  - The bar becomes translucent and blurred only after the hero starts leaving
 *    the viewport, so the top of the page stays clean.
 *  - The active link is tracked with IntersectionObserver rather than by reading
 *    scroll offsets, which means it stays correct even when sections have very
 *    different heights.
 *  - The mobile drawer locks body scroll while open and closes on Escape, so it
 *    cannot be left stranded behind the content.
 */
export default function PublicNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('#home');
  const drawerRef = useRef(null);
  const indicatorRef = useRef(null);
  const linkRefs = useRef({});

  /**
   * Slides the underline to sit under whichever link is active. Measured from the
   * live element rather than hardcoded, so it stays correct across breakpoints.
   */
  const moveIndicator = useCallback(() => {
    const bar = indicatorRef.current;
    const link = linkRefs.current[active];
    if (!bar || !link) return;

    const barBox = bar.parentElement.getBoundingClientRect();
    const linkBox = link.getBoundingClientRect();

    bar.style.setProperty('--ind-x', `${linkBox.left - barBox.left}px`);
    bar.style.setProperty('--ind-w', `${linkBox.width}px`);
  }, [active]);

  useEffect(() => {
    moveIndicator();
    window.addEventListener('resize', moveIndicator);
    return () => window.removeEventListener('resize', moveIndicator);
  }, [moveIndicator, scrolled]);

  /* translucent once the hero is behind us */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* scroll spy */
  useEffect(() => {
    const sections = nav
      .map((item) => document.querySelector(item.href))
      .filter(Boolean);
    if (sections.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry closest to the top of the viewport that is visible.
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(`#${visible[0].target.id}`);
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  /* body scroll lock while the drawer is open */
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  /* move focus into the drawer so keyboard and screen-reader users land there */
  useEffect(() => {
    if (open) drawerRef.current?.querySelector('a, button')?.focus();
  }, [open]);

  const go = useCallback((href) => {
    setOpen(false);
    const target = document.querySelector(href);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className={`site-nav ${scrolled ? 'is-scrolled' : ''} ${open ? 'is-open' : ''}`}>
        <div className="site-nav-inner">
          <a className="site-brand" href="#home" onClick={(e) => { e.preventDefault(); go('#home'); }}>
            <span className="site-brand-mark" aria-hidden="true">
              <img src={identity.photo} alt="" />
            </span>
            <span className="site-brand-text">{identity.shortName}</span>
          </a>

          <nav className="site-nav-links" aria-label="Primary">
            {nav.map((item) => (
              <a
                key={item.href}
                ref={(node) => {
                  linkRefs.current[item.href] = node;
                }}
                href={item.href}
                className={`site-nav-link ${active === item.href ? 'is-active' : ''}`}
                aria-current={active === item.href ? 'true' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  go(item.href);
                }}
              >
                {item.label}
              </a>
            ))}
            <a
              href="#contact"
              className="site-nav-cta"
              onClick={(e) => {
                e.preventDefault();
                go('#contact');
              }}
            >
              Let's Talk
            </a>
          </nav>

          <button
            type="button"
            className="site-nav-toggle"
            aria-expanded={open}
            aria-controls="site-drawer"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? 'close' : 'menu'} size={20} />
          </button>
        </div>
        <span className="site-nav-indicator" ref={indicatorRef} aria-hidden="true" />
      </header>

      <div
        id="site-drawer"
        ref={drawerRef}
        className={`site-drawer ${open ? 'is-open' : ''}`}
        hidden={!open}
      >
        <nav className="site-drawer-links" aria-label="Mobile">
          {nav.map((item, index) => (
            <a
              key={item.href}
              href={item.href}
              style={{ transitionDelay: `${index * 40}ms` }}
              onClick={(e) => {
                e.preventDefault();
                go(item.href);
              }}
            >
              <span className="site-drawer-index">{String(index + 1).padStart(2, '0')}</span>
              {item.label}
            </a>
          ))}
          <a
            href="#contact"
            className="site-drawer-cta"
            style={{ transitionDelay: `${nav.length * 40}ms` }}
            onClick={(e) => {
              e.preventDefault();
              go('#contact');
            }}
          >
            <span className="site-drawer-index">{String(nav.length + 1).padStart(2, '0')}</span>
            Let's Talk
          </a>
        </nav>
      </div>
      {open && <button type="button" className="site-drawer-scrim" aria-label="Close menu" onClick={() => setOpen(false)} />}
    </>
  );
}