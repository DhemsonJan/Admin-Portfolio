import { whatIDo } from '../site.js';
import Icon from '../components/Icon.jsx';
import Reveal from '../components/Reveal.jsx';
import SectionHeading from './SectionHeading.jsx';

/**
 * Four capability cards.
 *
 * The hover treatment is a border that brightens plus a spotlight that follows
 * the pointer. The spotlight is driven by CSS custom properties set on pointer
 * move, so no card re-renders while the cursor travels across the grid.
 */
function Card({ item, index }) {
  const onMove = (event) => {
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--spot-x', `${event.clientX - box.left}px`);
    event.currentTarget.style.setProperty('--spot-y', `${event.clientY - box.top}px`);
  };

  return (
    <Reveal
      as="article"
      className="capability"
      delay={index * 90}
      onPointerMove={onMove}
      tabIndex={0}
    >
      <span className="capability-spot" aria-hidden="true" />
      <div className="capability-top">
        <span className="capability-number">{item.number}</span>
        <span className="capability-icon" aria-hidden="true">
          <Icon name={item.icon} size={22} />
        </span>
      </div>
      <h3 className="capability-title">{item.title}</h3>
      <p className="capability-body">{item.body}</p>
      <span className="capability-line" aria-hidden="true" />
    </Reveal>
  );
}

export default function WhatIDo() {
  return (
    <section className="section" id="what-i-do" aria-labelledby="what-i-do-title">
      <div className="wrap">
        <SectionHeading eyebrow={whatIDo.eyebrow} title={whatIDo.title} id="what-i-do-title" />
        <div className="capability-grid">
          {whatIDo.items.map((item, index) => (
            <Card item={item} index={index} key={item.number} />
          ))}
        </div>
      </div>
    </section>
  );
}