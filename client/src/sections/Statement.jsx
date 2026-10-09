import { statement } from '../site.js';
import Reveal from '../components/Reveal.jsx';

/**
 * Short personal statement. The rule beneath it is an animated gradient sweep
 * rather than a static border, which gives the page a pulse without adding
 * decoration to the text itself.
 */
export default function Statement() {
  return (
    <section className="statement section" aria-labelledby="statement-title">
      <div className="wrap">
        <Reveal>
          <p className="statement-kicker">Introduction</p>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="statement-title" id="statement-title">
            {statement.title}
          </h2>
        </Reveal>
        <Reveal delay={160}>
          <p className="statement-body">{statement.body}</p>
        </Reveal>
      </div>
      <div className="animated-rule" aria-hidden="true">
        <span />
      </div>
    </section>
  );
}