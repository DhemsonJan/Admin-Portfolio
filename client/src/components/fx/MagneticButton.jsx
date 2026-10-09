import { useCallback, useRef } from 'react';

/**
 * Magnetic hover.
 *
 * The element leans a few pixels toward the pointer while it is nearby, then
 * springs back. Translation is applied through a CSS variable so the effect
 * composes with the button's own hover styles instead of fighting them.
 *
 * Pointer-only by design: on touch there is no hover to respond to, and offset
 * transforms make tap targets feel imprecise.
 */
export default function MagneticButton({
  children,
  strength = 0.28,
  className = '',
  as: Tag = 'button',
  ...rest
}) {
  const ref = useRef(null);

  const onMove = useCallback(
    (event) => {
      const node = ref.current;
      if (!node) return;
      const box = node.getBoundingClientRect();
      const x = (event.clientX - (box.left + box.width / 2)) * strength;
      const y = (event.clientY - (box.top + box.height / 2)) * strength;
      node.style.setProperty('--mag-x', `${x.toFixed(2)}px`);
      node.style.setProperty('--mag-y', `${y.toFixed(2)}px`);
    },
    [strength],
  );

  const reset = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    node.style.setProperty('--mag-x', '0px');
    node.style.setProperty('--mag-y', '0px');
  }, []);

  return (
    <Tag
      ref={ref}
      className={`magnetic ${className}`.trim()}
      onPointerMove={onMove}
      onPointerLeave={reset}
      onBlur={reset}
      {...rest}
    >
      <span className="magnetic-inner">{children}</span>
    </Tag>
  );
}