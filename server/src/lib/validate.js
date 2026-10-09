import { CATEGORIES, ROLES, STATUSES, SUGGESTED_TECHNOLOGIES } from '../services/projects.js';

export class ValidationError extends Error {
  constructor(message, fields = {}) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
    this.fields = fields;
  }
}

const MAX = {
  title: 140,
  shortDescription: 320,
  fullDescription: 8000,
  problem: 2000,
  solution: 2000,
  contribution: 2000,
  role: 80,
  url: 500,
  tags: 24,
  gallery: 12,
};

const str = (value) => (typeof value === 'string' ? value.trim() : '');

const isSafeHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const cleanUrl = (value, label, errors) => {
  const raw = str(value);
  if (!raw) return null;
  if (raw.length > MAX.url || !isSafeHttpUrl(raw)) {
    errors[label] = 'Enter a full URL starting with https://';
    return null;
  }
  return raw;
};

const cleanStringArray = (value, { max, label, errors }) => {
  const source = Array.isArray(value)
    ? value
    : String(value ?? '')
        .split(',')
        .map((item) => item.trim());

  const cleaned = [...new Set(source.map(str).filter(Boolean))];
  if (cleaned.length > max) errors[label] = `Use at most ${max} ${label}.`;
  return cleaned;
};

const isAssetRef = (value) => /^(https?:\/\/|\/)/.test(value);

/**
 * Validates and normalises a project payload coming from the admin form.
 *
 * `partial` is used for PATCH-style updates: any key the client omits is left
 * untouched in the database rather than being blanked out.
 */
export function validateProject(body = {}, { partial = false } = {}) {
  const errors = {};
  const out = {};
  const has = (key) => Object.hasOwn(body, key) && body[key] !== undefined;

  if (!partial || has('title')) {
    const title = str(body.title);
    if (!title) errors.title = 'Project title is required.';
    else if (title.length > MAX.title) errors.title = `Maximum ${MAX.title} characters.`;
    else out.title = title;
  }

  if (has('shortDescription')) {
    const value = str(body.shortDescription);
    if (value.length > MAX.shortDescription) {
      errors.shortDescription = `Maximum ${MAX.shortDescription} characters.`;
    } else {
      out.shortDescription = value;
    }
  }

  if (has('fullDescription')) {
    const value = String(body.fullDescription ?? '');
    if (value.length > MAX.fullDescription) {
      errors.fullDescription = `Maximum ${MAX.fullDescription} characters.`;
    } else {
      out.fullDescription = value.trim();
    }
  }

  if (has('category')) {
    const value = str(body.category);
    if (!CATEGORIES.includes(value)) errors.category = 'Choose a category from the list.';
    else out.category = value;
  }

  if (has('categories')) {
    const source = Array.isArray(body.categories) ? body.categories : [body.categories];
    const cleaned = [...new Set(source.map(str).filter(Boolean))];
    const unknown = cleaned.filter((value) => !CATEGORIES.includes(value));
    if (unknown.length > 0) errors.categories = 'One or more categories are not recognised.';
    else if (cleaned.length === 0) errors.categories = 'Pick at least one category.';
    else if (cleaned.length > 4) errors.categories = 'Use at most 4 categories.';
    else out.categories = cleaned;
  }

  // The primary category always reflects the first selected one so that
  // single-category displays stay coherent.
  if (out.categories?.length && !has('category')) {
    out.category = out.categories[0];
  }

  if (has('role')) {
    const value = str(body.role);
    if (value.length > MAX.role) errors.role = `Maximum ${MAX.role} characters.`;
    else out.role = value;
  }

  // Case-study blocks for the featured project. Optional, and length-capped.
  for (const field of ['problem', 'solution', 'contribution']) {
    if (has(field)) {
      const value = String(body[field] ?? '');
      if (value.length > MAX[field]) {
        errors[field] = `Maximum ${MAX[field]} characters.`;
      } else {
        out[field] = value.trim();
      }
    }
  }

  if (has('year')) {
    const raw = body.year;
    if (raw === null || raw === '') {
      out.year = null;
    } else {
      const year = Number(raw);
      const limit = new Date().getFullYear() + 1;
      if (!Number.isInteger(year) || year < 1990 || year > limit) {
        errors.year = 'Enter a valid four-digit year.';
      } else {
        out.year = year;
      }
    }
  }

  if (has('status')) {
    const value = str(body.status).toLowerCase();
    if (!STATUSES.includes(value)) errors.status = 'Status must be draft or published.';
    else out.status = value;
  }

  if (has('featured')) {
    out.featured = body.featured === true || body.featured === 'true' || body.featured === 1;
  }

  if (has('githubUrl')) out.githubUrl = cleanUrl(body.githubUrl, 'githubUrl', errors);

  // `websiteUrl` is the name the upload form and the public UI use for the live
  // link. It maps onto the existing `demo_url` column, and `demoUrl` stays
  // accepted so stored records and the detailed editor keep working.
  if (has('websiteUrl') || has('demoUrl')) {
    const raw = has('websiteUrl') ? body.websiteUrl : body.demoUrl;
    out.demoUrl = cleanUrl(raw, 'demoUrl', errors);
  }

  if (has('videoUrl')) {
    const raw = str(body.videoUrl);
    if (!raw) {
      out.videoUrl = null;
      out.videoType = 'none';
    } else if (/^https:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{6,}/i.test(raw)) {
      out.videoUrl = raw;
      out.videoType = 'youtube';
    } else if (/^https:\/\/([\w-]+\.)?vimeo\.com\/\d+/i.test(raw)) {
      out.videoUrl = raw;
      out.videoType = 'vimeo';
    } else if (isSafeHttpUrl(raw) && /\.(mp4|webm|ogg)$/i.test(raw)) {
      out.videoUrl = raw;
      out.videoType = 'file';
    } else {
      errors.videoUrl = 'Use a YouTube, Vimeo or direct .mp4 / .webm link.';
    }
  }

  if (has('thumbnailUrl')) {
    const raw = str(body.thumbnailUrl);
    if (raw && !isAssetRef(raw)) errors.thumbnailUrl = 'Invalid image reference.';
    else out.thumbnailUrl = raw || null;
  }

  if (has('gallery')) {
    const source = Array.isArray(body.gallery) ? body.gallery : [];
    const cleaned = [...new Set(source.map(str).filter(isAssetRef))];
    if (cleaned.length > MAX.gallery) errors.gallery = `Maximum ${MAX.gallery} images.`;
    else out.gallery = cleaned;
  }

  if (has('technologies')) {
    out.technologies = cleanStringArray(body.technologies, {
      max: MAX.tags,
      label: 'technologies',
      errors,
    });
  }

  if (has('keyFeatures')) {
    out.keyFeatures = cleanStringArray(body.keyFeatures, {
      max: MAX.tags,
      label: 'key features',
      errors,
    });
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Please fix the highlighted fields.', errors);
  }

  return out;
}

export function validateLogin(body = {}) {
  const pin = typeof body.pin === 'string' ? body.pin : '';
  if (!pin) throw new ValidationError('Enter your PIN to continue.', { pin: 'Required.' });
  if (pin.length > 128) throw new ValidationError('PIN is too long.');
  return { pin };
}

export const catalog = {
  categories: CATEGORIES,
  roles: ROLES,
  statuses: STATUSES,
  technologies: SUGGESTED_TECHNOLOGIES,
};