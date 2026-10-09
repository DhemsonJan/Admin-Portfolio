import { useCallback, useEffect, useRef, useState } from 'react';
import { identity } from '../site.js';

/**
 * Opening veil: the first thing a visitor sees.
 *
 * The portfolio sits behind a full-screen stage until the visitor opens it.
 * A single pointer controller on the veil supports every unlock gesture, so the
 * interaction is one system instead of competing handlers:
 *  - tap / click anywhere instantly opens;
 *  - press and hold fills the progress ring until it opens;
 *  - swipe or drag upward pulls the shutter up like a curtain.
 *
 * Keyboard users get a real button (Enter / Space), and `prefers-reduced-motion`
 * visitors skip the effect entirely via CSS. Once opened, the stage unmounts for
 * the whole session.
 */

const HOLD_MS = 320;
const SESSION_KEY = 'dt.portfolio.entered';

function useScrambleName(paused) {
  const ref = useRef(null);
  const intervalRef = useRef(null);
  const charsRef = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const name = identity.fullName.toUpperCase();
    const clean = name.replace(/ /g, '');

    if (paused) {
      el.textContent = `${identity.firstName.toUpperCase()} ${identity.lastName.toUpperCase()}`;
      return undefined;
    }

    el.textContent = scramble(name);
    charsRef.current = 0;

    intervalRef.current = setInterval(() => {
      if (!el) return;
      charsRef.current += 1 + Math.floor(Math.random() * 2);
      const resolveCount = Math.min(charsRef.current, clean.length);
      let wordCursor = 0;
      let seen = 0;
      el.textContent = [...name]
        .map((char) => {
          if (char === ' ') return ' ';
          const shouldResolve = seen < resolveCount;
          seen += 1;
          if (shouldResolve) return char;
          return String.fromCharCode(33 + Math.floor(Math.random() * 90));
        })
        .join('');
    }, 110);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused]);

  return ref;
}

function scramble(text) {
  return [...text]
    .map((char) => (char === ' ' ? ' ' : String.fromCharCode(33 + Math.floor(Math.random() * 90))))
    .join('');
}

export default function Intro() {
  const [phase, setPhase] = useState(() => (sessionStorage.getItem(SESSION_KEY) ? 'done' : 'idle'));
  const [progress, setProgress] = useState(0);
  const frameRef = useRef(null);
  const startRef = useRef(0);
  const doneRef = useRef(false);
  const openedByRef = useRef(null);

  const nameRef = useScrambleName(phase === 'done' || doneRef.current);

  const finish = useCallback(
    (gesture) => {
      if (doneRef.current) return;
      doneRef.current = true;
      openedByRef.current = gesture ?? openedByRef.current;
      sessionStorage.setItem(SESSION_KEY, '1');
      setProgress(1);
      setPhase('leaving');
    },
    [],
  );

  useEffect(() => {
    if (phase === 'leaving') {
      const timer = setTimeout(() => setPhase('done'), 900);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [phase]);

  useEffect(() => {
    if (phase !== 'idle') return undefined;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, [phase]);

  /* Reduced-motion visitors bypass the effect, never get trapped in it. */
  useEffect(() => {
    if (phase !== 'idle') return undefined;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) {
      finish('reduced-motion');
    }
  }, [phase, finish]);

  /* The whole veil is the controller: tap, hold, or swipe all open it. */
  const onVeilPointerDown = useCallback(
    (event) => {
      if (doneRef.current) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      const startY = event.clientY;
      const startX = event.clientX;
      const startedAt = performance.now();
      let maxDelta = 0;
      let didMove = false;
      let cancelled = false;

      const loop = (now) => {
        const elapsed = now - startedAt;
        if (elapsed >= HOLD_MS) {
          finish('hold');
          return;
        }
        setProgress(Math.min(1, elapsed / HOLD_MS));
        frameRef.current = requestAnimationFrame(loop);
      };
      frameRef.current = requestAnimationFrame(loop);

      const onMove = (moveEvent) => {
        const dx = moveEvent.clientX - startX;
        const delta = startY - moveEvent.clientY;
        if (Math.abs(dx) > 6 || Math.abs(delta) > 6) didMove = true;
        maxDelta = Math.max(maxDelta, delta);
        const swipe = window.innerHeight * 0.55;
        const value = Math.min(1, Math.max(0, delta / swipe));
        if (value > 0) {
          cancelAnimationFrame(frameRef.current);
          setProgress(value);
        }
        if (maxDelta >= window.innerHeight * 0.5) {
          cancelled = true;
          cleanup();
          finish('swipe');
        }
      };

      const onUp = () => {
        cleanup();
        if (cancelled || doneRef.current) return;
        const elapsed = performance.now() - startedAt;
        // Tap: released quickly with no meaningful drag.
        if (!didMove || elapsed < HOLD_MS) finish('tap');
        else setProgress(0);
      };

      const cleanup = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        cancelAnimationFrame(frameRef.current);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    },
    [finish],
  );

  const onKeyOpen = useCallback(
    (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      finish('keyboard');
    },
    [finish],
  );

  if (phase === 'done') return null;

  const leaving = phase === 'leaving';

  return (
    <div
      className={`intro ${leaving ? 'is-leaving' : ''}`}
      onPointerDown={onVeilPointerDown}
    >
      <div className="intro-grid" />
      <div className="intro-aura intro-aura-a" />
      <div className="intro-aura intro-aura-b" />

      <div className="intro-inner">
        <p className="intro-kicker">PORTFOLIO · {new Date().getFullYear()}</p>

        <div className="intro-mark" aria-hidden="true">
          <span className="intro-mark-ring" />
          <img className="intro-mark-photo" src={identity.photo} alt={identity.alt} />
        </div>

        <h1 className="intro-title">
          <span className="intro-title-glow" ref={nameRef} />
        </h1>
        <p className="intro-role">{identity.roleLine}</p>

        <div className="intro-handle" aria-hidden="true">
          <span
            className="intro-handle-track is-warm"
            style={{ '--load': `${progress}` }}
          />
          <span className="intro-handle-knob" style={{ '--load': `${progress}` }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M6 11l6-6 6 6" />
            </svg>
          </span>
          <span className="intro-handle-label">
            {progress === 0 ? 'Hold to enter' : progress >= 1 ? 'Welcome' : 'Opening…'}
          </span>
        </div>

        <button type="button" className="intro-tap" tabIndex={0} onKeyDown={onKeyOpen}>
          <span className="intro-tap-ring" style={{ '--load': `${progress}` }} />
          <span>
            Click, hold or swipe up to open
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 17L17 7M9 7h8v8" />
            </svg>
          </span>
        </button>

        <p className="intro-hint">ready when you are</p>
      </div>

      <div className="intro-shutter" aria-hidden="true">
        <span className="intro-shutter-a" />
        <span className="intro-shutter-b" />
      </div>
    </div>
  );
}