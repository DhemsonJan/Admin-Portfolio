import { getDb } from '../db/index.js';
import { newId, nowIso } from '../lib/ids.js';

export const CATEGORIES = [
  'Web Development',
  'Front-End',
  'Back-End',
  'Full-Stack',
  'UI/UX',
  'Computer Engineering',
  'AI / Machine Learning',
  'IoT',
  'Other',
];

export const ROLES = [
  'Developer',
  'Front-End Developer',
  'Back-End Developer',
  'Full-Stack Developer',
  'UI/UX Designer',
  'System Developer',
  'Project Lead',
];

export const STATUSES = ['draft', 'published'];

export const SUGGESTED_TECHNOLOGIES = [
  'React.js', 'Next.js', 'Vue.js', 'Node.js', 'Express.js', 'JavaScript',
  'TypeScript', 'HTML5', 'CSS3', 'PHP', 'MySQL', 'PostgreSQL', 'MongoDB',
  'Firebase', 'Python', 'Flask', 'ESP32', 'ESP32-S3', 'ESP32-CAM',
  'Arduino', 'Raspberry Pi', 'Figma', 'Tailwind CSS', 'Docker', 'AWS',
];

const parseJson = (value, fallback) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || value.trim() === '') return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

/** Maps a database row into the camelCase shape the API returns. */
export function mapProject(row) {
  if (!row) return null;
  const categories = parseJson(row.categories, []);
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    shortDescription: row.short_description,
    fullDescription: row.full_description,
    category: row.category,
    categories: categories.length > 0 ? categories : [row.category],
    technologies: parseJson(row.technologies, []),
    keyFeatures: parseJson(row.key_features, []),
    problem: row.problem || '',
    solution: row.solution || '',
    contribution: row.contribution || '',
    role: row.role,
    year: row.project_year ?? null,
    githubUrl: row.github_url || null,
    demoUrl: row.demo_url || null,
    // Alias for the live-site link, matching the upload form's field name.
    websiteUrl: row.demo_url || null,
    videoUrl: row.video_url || null,
    videoType: row.video_type || 'none',
    thumbnailUrl: row.thumbnail_url || null,
    gallery: parseJson(row.gallery, []),
    status: row.status,
    featured: Boolean(row.featured),
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT = `SELECT * FROM projects`;

export async function listPublished() {
  const db = await getDb();
  const rows = await db.all(
    `${SELECT} WHERE status = ? ORDER BY sort_order ASC, created_at DESC`,
    ['published'],
  );
  return rows.map(mapProject);
}

export async function listAll() {
  const db = await getDb();
  const rows = await db.all(`${SELECT} ORDER BY sort_order ASC, created_at DESC`);
  return rows.map(mapProject);
}

export async function findById(id) {
  const db = await getDb();
  return mapProject(await db.get(`${SELECT} WHERE id = ?`, [id]));
}

export async function findBySlug(slug) {
  const db = await getDb();
  return mapProject(await db.get(`${SELECT} WHERE slug = ?`, [slug]));
}

export async function takeAllSlugs() {
  const db = await getDb();
  const rows = await db.all('SELECT slug FROM projects');
  return new Set(rows.map((row) => row.slug));
}

export async function nextSortOrder() {
  const db = await getDb();
  const row = await db.get('SELECT COALESCE(MAX(sort_order), -1) AS max FROM projects');
  return Number(row?.max ?? -1) + 1;
}

export async function createProject(data) {
  const db = await getDb();
  const timestamp = nowIso();
  const row = {
    id: data.id ?? newId(),
    slug: data.slug,
    title: data.title,
    short_description: data.shortDescription ?? '',
    full_description: data.fullDescription ?? '',
    category: data.category ?? 'Other',
    categories: JSON.stringify(data.categories ?? [data.category ?? 'Other']),
    technologies: JSON.stringify(data.technologies ?? []),
    key_features: JSON.stringify(data.keyFeatures ?? []),
    problem: data.problem ?? '',
    solution: data.solution ?? '',
    contribution: data.contribution ?? '',
    role: data.role ?? '',
    project_year: data.year ?? null,
    github_url: data.githubUrl ?? null,
    demo_url: data.demoUrl ?? null,
    video_url: data.videoUrl ?? null,
    video_type: data.videoType ?? 'none',
    thumbnail_url: data.thumbnailUrl ?? null,
    gallery: JSON.stringify(data.gallery ?? []),
    status: data.status ?? 'draft',
    // Kept as a real boolean. toSqliteValue() downgrades it to 1/0 for SQLite,
    // while pg serialises it natively for Postgres. Downgrading here would send
    // an integer into a BOOLEAN column and Postgres would reject the insert.
    featured: data.featured,
    sort_order: data.sortOrder ?? (await nextSortOrder()),
    created_at: timestamp,
    updated_at: timestamp,
  };

  await db.run(
    `INSERT INTO projects (
      id, slug, title, short_description, full_description, category, categories,
      technologies, key_features, problem, solution, contribution, role, project_year,
      github_url, demo_url, video_url, video_type, thumbnail_url, gallery, status,
      featured, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    Object.values(row),
  );

  return findById(row.id);
}

const UPDATABLE = {
  title: 'title',
  shortDescription: 'short_description',
  fullDescription: 'full_description',
  category: 'category',
  problem: 'problem',
  solution: 'solution',
  contribution: 'contribution',
  role: 'role',
  year: 'project_year',
  githubUrl: 'github_url',
  demoUrl: 'demo_url',
  websiteUrl: 'demo_url',
  videoUrl: 'video_url',
  videoType: 'video_type',
  thumbnailUrl: 'thumbnail_url',
  status: 'status',
};

export async function updateProject(id, patch) {
  const db = await getDb();
  const assignments = [];
  const params = [];

  for (const [key, column] of Object.entries(UPDATABLE)) {
    if (patch[key] !== undefined) {
      assignments.push(`${column} = ?`);
      params.push(patch[key]);
    }
  }

  if (patch.technologies !== undefined) {
    assignments.push('technologies = ?');
    params.push(JSON.stringify(patch.technologies));
  }
  if (patch.categories !== undefined) {
    assignments.push('categories = ?');
    params.push(JSON.stringify(patch.categories));
  }
  if (patch.keyFeatures !== undefined) {
    assignments.push('key_features = ?');
    params.push(JSON.stringify(patch.keyFeatures));
  }
  if (patch.gallery !== undefined) {
    assignments.push('gallery = ?');
    params.push(JSON.stringify(patch.gallery));
  }
  if (patch.featured !== undefined) {
    assignments.push('featured = ?');
    params.push(patch.featured);
  }
  if (patch.sortOrder !== undefined) {
    assignments.push('sort_order = ?');
    params.push(patch.sortOrder);
  }
  if (patch.slug !== undefined) {
    assignments.push('slug = ?');
    params.push(patch.slug);
  }

  if (assignments.length === 0) return findById(id);

  assignments.push('updated_at = ?');
  params.push(nowIso(), id);

  await db.run(`UPDATE projects SET ${assignments.join(', ')} WHERE id = ?`, params);
  return findById(id);
}

export async function deleteProject(id) {
  const db = await getDb();
  const { changes } = await db.run('DELETE FROM projects WHERE id = ?', [id]);
  return changes > 0;
}

export async function setStatus(id, status) {
  return updateProject(id, { status });
}

export async function setFeatured(id, featured) {
  return updateProject(id, { featured });
}

/**
 * Persists an explicit display order. Ids that were not sent keep their
 * relative position after the ones that were.
 */
export async function reorderProjects(ids) {
  const db = await getDb();
  const timestamp = nowIso();

  await db.tx(async (tx) => {
    for (let index = 0; index < ids.length; index += 1) {
      await tx.run('UPDATE projects SET sort_order = ?, updated_at = ? WHERE id = ?', [
        index,
        timestamp,
        ids[index],
      ]);
    }
  });

  return listAll();
}

export async function stats() {
  const db = await getDb();
  const rows = await db.all(
    'SELECT status, featured, COUNT(*) AS count FROM projects GROUP BY status, featured',
  );

  let total = 0;
  let published = 0;
  let drafts = 0;
  let featured = 0;

  for (const row of rows) {
    const count = Number(row.count);
    total += count;
    if (row.status === 'published') published += count;
    if (row.status === 'draft') drafts += count;
    if (row.featured) featured += count;
  }

  return { total, published, drafts, featured };
}