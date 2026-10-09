import { about, identity } from '../site.js';
import Reveal from '../components/Reveal.jsx';
import SectionHeading from './SectionHeading.jsx';
import Parallax from '../components/fx/Parallax.jsx';

export default function About() {
  return (
    <section className="section about" id="about" aria-labelledby="about-title">
      <div className="wrap about-inner">
        <div className="about-portrait-col">
          <Reveal>
            <div className="about-portrait">
              <Parallax speed={0.05}>
                <div className="about-photo-frame">
                  <img src={identity.photo} alt={identity.alt} width="420" height="420" loading="lazy" />
                </div>
              </Parallax>
              <div className="about-portrait-glow" aria-hidden="true" />
              <span className="about-portrait-ring" aria-hidden="true" />
            </div>
          </Reveal>

          <Reveal delay={140} className="about-facts">
            <dl>
              {about.facts.map((fact) => (
                <div className="about-fact" key={fact.label}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <div className="about-copy">
          <SectionHeading eyebrow={about.eyebrow} title={about.title} id="about-title" />

          {about.body.map((paragraph, index) => (
            <Reveal delay={120 + index * 90} key={paragraph.slice(0, 24)}>
              <p className="about-paragraph">{paragraph}</p>
            </Reveal>
          ))}

          <Reveal delay={320} className="about-signature">
            <span className="about-signature-name">{identity.fullName}</span>
            <span className="about-signature-role">{identity.roleLine}</span>
          </Reveal>
        </div>
      </div>
    </section>
  );
}