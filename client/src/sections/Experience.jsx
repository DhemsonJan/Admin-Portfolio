import { experience } from '../site.js';
import Reveal from '../components/Reveal.jsx';
import SectionHeading from './SectionHeading.jsx';

/**
 * Experience timeline.
 *
 * Framed explicitly as internship experience. The timeline marker travels its
 * rail as each entry scrolls in, which ties the visual rhythm to reading order.
 */
export default function Experience() {
  return (
    <section className="section" id="experience" aria-labelledby="experience-title">
      <div className="wrap">
        <SectionHeading
          eyebrow={experience.eyebrow}
          title={experience.title}
          lede="Internship experience — hands-on work across front-end, back-end, and design."
          id="experience-title"
        />

        <ol className="timeline">
          {experience.items.map((item, index) => (
            <Reveal as="li" className="timeline-item" delay={index * 120} key={item.company}>
              <span className="timeline-marker" aria-hidden="true">
                <span className="timeline-marker-dot" />
              </span>

              <div className="timeline-card">
                <div className="timeline-head">
                  <div>
                    <h3 className="timeline-role">{item.role}</h3>
                    <p className="timeline-company">{item.company}</p>
                  </div>
                  <span className="timeline-meta">{item.meta}</span>
                </div>

                <p className="timeline-summary">{item.summary}</p>

                <ul className="tag-list is-compact" aria-label="Technologies and tasks">
                  {item.tags.map((tag) => (
                    <li className="tag" key={tag}>
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}