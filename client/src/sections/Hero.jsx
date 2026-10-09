import { useEffect, useRef } from 'react';
import { hero, identity } from '../site.js';
import Icon from '../components/Icon.jsx';
import MagneticButton from '../components/fx/MagneticButton.jsx';
import TypeReveal from '../components/fx/TypeReveal.jsx';
import Reveal from '../components/Reveal.jsx';

/**
 * The portrait orbit.
 *
 * Labels are positioned on an ellipse around the photo and drift slowly, so the
 * composition stays alive without demanding attention. Offsets are fractions of
 * the frame rather than pixels, which keeps the layout intact at any size.
 */
function Orbit({ labels }) {
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  return (
    <div className="orbit" aria-hidden="true">
      <div className="orbit-ring orbit-ring-outer" />
      <div className="orbit-ring orbit-ring-inner" />

      <div className="orbit-core">
        <img src={identity.photo} alt={identity.alt} width="320" height="320" fetchPriority="high" />
        <div className="orbit-core-sheen" />
      </div>

      {labels.map((label, index) => {
        // Golden-angle spacing keeps labels from ever stacking up.
        const angle = (index / labels.length) * Math.PI * 2 - Math.PI / 2;
        const x = 50 + Math.cos(angle) * 50;
        const y = 50 + Math.sin(angle) * 50;
        return (
          <span
            key={label}
            className="orbit-label"
            style={{
              '--x': `${x}%`,
              '--y': `${y}%`,
              '--drift': `${reduced.current ? '0s' : `${8 + (index % 4) * 2}s`}`,
              '--delay': `${-index * 0.7}s`,
            }}
          >
            {label}
          </span>
        );
      })}

      <span className="orbit-link orbit-link-a" />
      <span className="orbit-link orbit-link-b" />
    </div>
  );
}

export default function Hero() {
  const go = (href) => (event) => {
    event.preventDefault();
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="hero" id="home" aria-label="Introduction">
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-aura" aria-hidden="true" />

      <div className="hero-inner">
        <div className="hero-copy">
          <Reveal className="hero-status">
            <span className="status-dot" aria-hidden="true">
              <span className="status-dot-pulse" />
            </span>
            {hero.eyebrow}
          </Reveal>

          <h1 className="hero-title">
            <TypeReveal lines={hero.headline} />
          </h1>

          <Reveal delay={260} className="hero-body-wrap">
            <p className="hero-body">{hero.body}</p>
          </Reveal>

          <Reveal delay={360} className="hero-actions">
            <MagneticButton as="a" href={hero.primary.href} className="btn btn-primary" onClick={go(hero.primary.href)}>
              {hero.primary.label}
              <Icon name="arrow" size={17} />
            </MagneticButton>

            <MagneticButton
              as="a"
              href={hero.secondary.href}
              className="btn btn-ghost"
              download={hero.secondary.download || undefined}
            >
              <Icon name="download" size={17} />
              {hero.secondary.label}
            </MagneticButton>
          </Reveal>
        </div>

        <div className="hero-portrait">
          <Orbit labels={hero.labels} />
        </div>
      </div>

      <div className="hero-foot">
        <a href="#projects" className="hero-scroll" onClick={go('#projects')}>
          <span className="hero-scroll-line" aria-hidden="true" />
          Scroll to explore
        </a>
      </div>
    </section>
  );
}