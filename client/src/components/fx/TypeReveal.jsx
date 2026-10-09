import { useEffect, useRef, useState } from 'react';

/**
 * Line-by-line headline reveal.
 *
 * Each line is masked and slides up from behind its own clipping edge, which is
 * what gives the hero its editorial feel. Text is split on explicit array items
 * rather than words so line breaks stay art-directed.
 */
export default function TypeReveal({ lines = [], delay = 90, className = '', as: Tag = 'span' }) {
  const ref = useRef(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      setStarted(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`type-reveal ${started ? 'is-started' : ''} ${className}`.trim()}>
      {lines.map((line, index) => (
        <span className="type-reveal-line" key={line}>
          <span className="type-reveal-inner" style={{ transitionDelay: `${index * delay}ms` }}>
            {line}
          </span>
        </span>
      ))}
    </Tag>
  );
}