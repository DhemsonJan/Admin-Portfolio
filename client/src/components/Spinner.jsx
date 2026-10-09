export function Spinner({ label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
      <span className="spinner" aria-hidden="true" />
      {label ? <span>{label}</span> : null}
      <span className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
        Loading
      </span>
    </span>
  );
}

export function LoadingBlock({ label = 'Loading…' }) {
  return (
    <div
      style={{
        display: 'grid',
        placeItems: 'center',
        gap: '0.9rem',
        padding: '4rem 1rem',
        color: 'var(--text-faint)',
      }}
    >
      <span className="spinner" style={{ width: 22, height: 22 }} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="project-card" aria-hidden="true">
      <div className="skeleton" style={{ aspectRatio: '16 / 10', borderRadius: 0 }} />
      <div className="project-body">
        <div className="skeleton" style={{ height: 18, width: '75%' }} />
        <div className="skeleton" style={{ height: 12, width: '100%' }} />
        <div className="skeleton" style={{ height: 12, width: '60%' }} />
        <div className="skeleton" style={{ height: 26, width: '45%', marginTop: '0.6rem' }} />
      </div>
    </div>
  );
}

export default Spinner;