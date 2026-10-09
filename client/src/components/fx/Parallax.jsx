import { useEffect, useRef } from 'react';

/**
 * Subtle parallax.
 *
 * The child is translated against the scroll position of its parent, so the
 * effect is self-contained: no shared scroll state, and only the element that
 * actually moves is transformed.
 *
 * `speed` is the fraction of the travel distance to apply — small values read as
 * depth, large values read as a gimmick.
 */
export default function Parallax({ children, speed = 0.12, className = '', ...rest }) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let frame = 0;

    const update = () => {
      frame = 0;
      const box = node.getBoundingClientRect();
      const viewport = window.innerHeight;

      // Positive when entering from below, negative once it has scrolled past.
      const progress = (viewport - box.top) / (viewport + box.height) - 0.5;
      node.style.setProperty('--parallax', `${(progress * speed * 100).toFixed(2)}px`);
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [speed]);

  return (
    <div ref={ref} className={`parallax ${className}`.trim()} {...rest}>
      <div className="parallax-inner">{children}</div>
    </div>
  );
}