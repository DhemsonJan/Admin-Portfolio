import { education } from '../site.js';
import Reveal from '../components/Reveal.jsx';
import SectionHeading from './SectionHeading.jsx';

export default function Education() {
  return (
    <section className="section" id="education" aria-labelledby="education-title">
      <div className="wrap">
        <SectionHeading
          eyebrow={education.eyebrow}
          title={education.title}
          id="education-title"
        />

        <div className="edu-list">
          {education.items.map((item, index) => (
            <Reveal className="edu-item" delay={index * 110} key={item.degree}>
              <span className="edu-year" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>

              <div className="edu-card">
                <div className="edu-head">
                  <h3 className="edu-degree">{item.degree}</h3>
                  <span className="edu-status">{item.status}</span>
                </div>
                {/* TODO(placeholder): replace with the university and year. */}
                <p className="edu-detail">{item.detail}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}