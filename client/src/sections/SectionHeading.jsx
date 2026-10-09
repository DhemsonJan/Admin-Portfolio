import Reveal from '../components/Reveal.jsx';

/**
 * Shared section header: a small eyebrow, a large editorial title, and an
 * optional lede. Keeping this in one place is what makes the vertical rhythm
 * consistent across sections without repeating markup.
 */
export default function SectionHeading({ eyebrow, title, lede, id, align = 'start', action = null }) {
  return (
    <div className={`section-heading is-${align}`}>
      <div>
        {eyebrow && (
          <Reveal>
            <p className="section-eyebrow">
              <span className="section-eyebrow-mark" aria-hidden="true" />
              {eyebrow}
            </p>
          </Reveal>
        )}
        <Reveal delay={70}>
          <h2 className="section-title" id={id}>
            {title}
          </h2>
        </Reveal>
        {lede && (
          <Reveal delay={140}>
            <p className="section-lede">{lede}</p>
          </Reveal>
        )}
      </div>
      {action && <Reveal delay={140}>{action}</Reveal>}
    </div>
  );
}