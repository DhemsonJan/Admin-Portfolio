import { useEffect, useRef } from 'react';

/**
 * A soft light that follows the pointer.
 *
 * Position is written to CSS custom properties on a single element rather than
 * React state, so the glow never triggers a re-render. The movement is eased in
 * CSS, which keeps the follow feeling like a physical light source instead of a
 * cursor glued to the screen.
 */
export default function CursorGlow() {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    // Skip entirely on coarse pointers, where there is no hover, and for anyone
    // who has asked for less motion.
    const fine = window.matchMedia('(pointer: fine)').matches;
    if (!fine || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      node.style.display = 'none';
      return undefined;
    }

    let frame = 0;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;

    const paint = () => {
      frame = 0;
      node.style.setProperty('--glow-x', `${x}px`);
      node.style.setProperty('--glow-y', `${y}px`);
    };

    const onMove = (event) => {
      x = event.clientX;
      y = event.clientY;
      if (!frame) frame = requestAnimationFrame(paint);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  return <div className="cursor-glow" ref={ref} aria-hidden="true" />;
}