export const formatYear = (year) => (year ? String(year) : '—');

export const formatDate = (iso) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export const relativeTime = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  const steps = [
    [60, 'second'],
    [3600, 'minute'],
    [86400, 'hour'],
    [604800, 'day'],
    [2629800, 'week'],
    [31557600, 'month'],
  ];

  let previous = 1;
  for (const [limit, unit] of steps) {
    if (seconds < limit) {
      const value = Math.max(1, Math.round(seconds / previous));
      return `${value} ${unit}${value === 1 ? '' : 's'} ago`;
    }
    previous = limit;
  }
  const years = Math.round(seconds / 31557600);
  return `${years} year${years === 1 ? '' : 's'} ago`;
};

/** Deterministic accent so a project without a thumbnail still looks designed. */
const GRADIENTS = [
  ['#22d3ee', '#0ea5e9'],
  ['#38bdf8', '#6366f1'],
  ['#2dd4bf', '#0891b2'],
  ['#818cf8', '#22d3ee'],
  ['#67e8f9', '#1d4ed8'],
  ['#5eead4', '#0f766e'],
];

export const gradientFor = (seed = '') => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const [from, to] = GRADIENTS[hash % GRADIENTS.length];
  return `linear-gradient(135deg, ${from} 0%, ${to} 100%)`;
};

export const initials = (text = '') =>
  text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('') || 'PR';

export const isVideoFile = (url = '') => /\.(mp4|webm|ogg)$/i.test(url);

export function youtubeEmbedUrl(url = '') {
  const match =
    url.match(/youtube\.com\/watch\?v=([\w-]{6,})/) ?? url.match(/youtu\.be\/([\w-]{6,})/);
  return match ? `https://www.youtube-nocookie.com/embed/${match[1]}` : null;
}

export function vimeoEmbedUrl(url = '') {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? `https://player.vimeo.com/video/${match[1]}` : null;
}