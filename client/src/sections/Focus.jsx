import { focus } from '../site.js';
import Reveal from '../components/Reveal.jsx';
import SectionHeading from './SectionHeading.jsx';

/**
 * Career focus.
 *
 * The roles are rendered as an unordered set with identical weight and no
 * ordering — a ranked list would imply a preference the copy does not claim.
 */
export default function Focus() {
  return (
    <section className="section focus" aria-labelledby="focus-title">
      <div className="focus-aura" aria-hidden="true" />
      <div className="wrap">
        <div className="focus-inner">
          <SectionHeading
            eyebrow={focus.eyebrow}
            title={focus.title}
            lede={focus.body}
            id="focus-title"
            align="center"
          />

          <ul className="focus-roles">
            {focus.roles.map((role, index) => (
              <Reveal as="li" className="focus-role" delay={index * 90} key={role}>
                <span className="focus-role-dot" aria-hidden="true" />
                {role}
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}