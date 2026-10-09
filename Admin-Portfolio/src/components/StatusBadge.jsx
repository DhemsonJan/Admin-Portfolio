export function StatusBadge({ status }) {
  const label = status === 'published' ? 'Published' : 'Draft';
  return (
    <span className={`badge badge-${status === 'published' ? 'published' : 'draft'}`}>
      <span className="badge-dot" aria-hidden="true" />
      {label}
    </span>
  );
}

export function FeaturedBadge() {
  return <span className="badge badge-featured">★ Featured</span>;
}

export default StatusBadge;