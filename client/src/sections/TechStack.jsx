import { stack } from '../site.js';
import Reveal from '../components/Reveal.jsx';
import SectionHeading from './SectionHeading.jsx';

/**
 * Technology inventory.
 *
 * Presented as plain lists rather than percentage meters. A number like "HTML5 —
 * 90%" implies a measurement that does not exist and reads as padding; the
 * honest signal here is which tools appear in real work.
 */
export default function TechStack() {
  return (
    <section className="section stack" id="skills" aria-labelledby="stack-title">
      <div className="wrap">
        <SectionHeading
          eyebrow={stack.eyebrow}
          title={stack.title}
          lede={stack.note}
          id="stack-title"
        />

        <div className="stack-grid">
          {stack.groups.map((group, index) => (
            <Reveal
              as="div"
              className="stack-group"
              delay={index * 80}
              key={group.title}
            >
              <h3 className="stack-group-title">{group.title}</h3>
              <ul className="stack-items">
                {group.items.map((item) => (
                  <li key={item} tabIndex={0}>
                    <span className="stack-dot" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}