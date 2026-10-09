import { stack } from '../site.js';

/**
 * Full-width scrolling ticker of technologies.
 *
 * Content is rendered twice so the loop can translate exactly one copy width
 * and reset seamlessly. `aria-hidden` on the duplicate keeps it out of the
 * accessibility tree, and `prefers-reduced-motion` halts the animation (the
 * global reduced-motion rule also kills it for wider safe coverage).
 */
export default function Marquee({ items }) {
  const words = items ?? stack.groups.flatMap((group) => group.items);

  return (
    <section className="ticker" aria-hidden="true">
      <div className="ticker-track">
        {[0, 1].map((copy) => (
          <div className="ticker-copy" key={copy}>
            {words.map((word, index) => (
              <span key={`${copy}-${word}`} className="ticker-item">
                <span className="ticker-word">{word}</span>
                <span className="ticker-spark" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}