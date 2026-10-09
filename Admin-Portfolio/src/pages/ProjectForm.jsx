import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from 'shared/lib/api.js';
import { useProjects } from './ProjectsProvider.jsx';
import { useToast } from 'shared/components/Toast.jsx';
import TagInput from '../components/TagInput.jsx';
import ImageUploader from '../components/ImageUploader.jsx';
import { LoadingBlock } from 'shared/components/Spinner.jsx';
import { gradientFor, initials, isVideoFile, vimeoEmbedUrl, youtubeEmbedUrl } from '../lib/format.js';

const FALLBACK_CATEGORIES = [
  'Web Development', 'Front-End', 'Back-End', 'Full-Stack', 'UI/UX',
  'Computer Engineering', 'AI / Machine Learning', 'IoT', 'Other',
];

const FALLBACK_TECHS = [
  'React.js', 'Node.js', 'Express.js', 'JavaScript', 'HTML5', 'CSS3', 'PHP',
  'MySQL', 'Firebase', 'Python', 'Flask', 'ESP32', 'Figma',
];

const FALLBACK_ROLES = [
  'Developer', 'Front-End Developer', 'Back-End Developer', 'Full-Stack Developer',
  'UI/UX Designer', 'System Developer', 'Project Lead',
];

const FEATURE_SUGGESTIONS = [
  'Waste Classification', 'Image Detection', 'Sensor Monitoring', 'Web Dashboard',
  'Automated Sorting',
];

const emptyForm = {
  title: '',
  shortDescription: '',
  fullDescription: '',
  categories: ['Web Development'],
  technologies: [],
  keyFeatures: [],
  role: '',
  year: '',
  githubUrl: '',
  demoUrl: '',
  videoUrl: '',
  thumbnailUrl: '',
  gallery: [],
  status: 'draft',
  featured: false,
};

/** Serialisable form state, used for autosave and for the API payload. */
const toForm = (project) => ({
  title: project.title ?? '',
  shortDescription: project.shortDescription ?? '',
  fullDescription: project.fullDescription ?? '',
  categories: project.categories?.length ? project.categories : [project.category ?? 'Other'],
  technologies: project.technologies ?? [],
  keyFeatures: project.keyFeatures ?? [],
  role: project.role ?? '',
  year: project.year ?? '',
  githubUrl: project.githubUrl ?? '',
  demoUrl: project.demoUrl ?? '',
  videoUrl: project.videoUrl ?? '',
  thumbnailUrl: project.thumbnailUrl ?? '',
  gallery: project.gallery ?? [],
  status: project.status ?? 'draft',
  featured: Boolean(project.featured),
});

const draftKey = (id) => `pm-draft-${id ?? 'new'}`;

export default function ProjectForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const { upsert, refresh, projects, maxFeatured, stats } = useProjects();

  const [form, setForm] = useState(emptyForm);
  const [meta, setMeta] = useState({ categories: FALLBACK_CATEGORIES, technologies: FALLBACK_TECHS, roles: FALLBACK_ROLES });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [restored, setRestored] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  const hydrated = useRef(false);

  /* ------------------------------------------------------------ load */

  useEffect(() => {
    api
      .getMeta()
      .then((catalog) =>
        setMeta({
          categories: catalog.categories,
          technologies: catalog.technologies,
          roles: catalog.roles,
        }),
      )
      .catch(() => {});

    if (!isEdit) {
      hydrated.current = true;
      return;
    }

    api
      .admin
      .get(id)
      .then(({ project }) => {
        const draft = loadDraft(id);
        setForm(draft ? { ...toForm(project), ...draft } : toForm(project));
        if (draft) setRestored(true);
      })
      .catch((error) => {
        if (error.status === 401) return;
        toast.fromError(error, 'Could not load that project.');
        navigate('/admin/projects/list');
      })
      .finally(() => {
        hydrated.current = true;
        setLoading(false);
      });
  }, [id, isEdit, navigate, toast]);

  /* ------------------------------------------------------------ autosave */

  useEffect(() => {
    if (!hydrated.current) return undefined;

    const timer = setTimeout(() => {
      try {
        window.localStorage.setItem(draftKey(id), JSON.stringify(form));
        setSavedAt(Date.now());
      } catch {
        /* storage full or blocked — autosave is a convenience, not a requirement */
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [form, id]);

  /* ------------------------------------------------------------ helpers */

  const set = useCallback((patch) => {
    setForm((current) => ({ ...current, ...patch }));
    setErrors((current) => {
      const next = { ...current };
      for (const key of Object.keys(patch)) delete next[key];
      return next;
    });
  }, []);

  const toggleCategory = (category) => {
    setForm((current) => {
      const has = current.categories.includes(category);
      if (has) {
        const next = current.categories.filter((item) => item !== category);
        return { ...current, categories: next.length ? next : current.categories };
      }
      return current.categories.length >= 4
        ? current
        : { ...current, categories: [...current.categories, category] };
    });
  };

  const payload = useCallback(
    (form) => ({
      title: form.title.trim(),
      shortDescription: form.shortDescription.trim(),
      fullDescription: form.fullDescription,
      categories: form.categories,
      technologies: form.technologies,
      keyFeatures: form.keyFeatures,
      role: form.role.trim(),
      year: form.year === '' ? null : Number(form.year),
      githubUrl: form.githubUrl.trim() || null,
      demoUrl: form.demoUrl.trim() || null,
      videoUrl: form.videoUrl.trim() || null,
      thumbnailUrl: form.thumbnailUrl || null,
      gallery: form.gallery,
      status: form.status,
      featured: form.featured,
    }),
    [],
  );

  const validate = useCallback((form) => {
    const found = {};
    if (!form.title.trim()) found.title = 'Project title is required.';

    if (form.year !== '' && form.year !== null) {
      const year = Number(form.year);
      if (!Number.isInteger(year) || year < 1990 || year > new Date().getFullYear() + 1) {
        found.year = 'Enter a valid four-digit year.';
      }
    }

    for (const [key, value] of [
      ['githubUrl', form.githubUrl],
      ['demoUrl', form.demoUrl],
    ]) {
      if (value.trim()) {
        try {
          const url = new URL(value.trim());
          if (url.protocol !== 'https:' && url.protocol !== 'http:') {
            found[key] = 'Enter a full http(s) URL.';
          }
        } catch {
          found[key] = 'Enter a full URL starting with https://';
        }
      }
    }

    if (
      form.videoUrl.trim() &&
      !youtubeEmbedUrl(form.videoUrl) &&
      !vimeoEmbedUrl(form.videoUrl) &&
      !isVideoFile(form.videoUrl)
    ) {
      found.videoUrl = 'Use a YouTube, Vimeo or direct .mp4 / .webm link.';
    }

    // The featured limit is enforced server-side; the UI only warns.
    return found;
  }, []);

  const save = useCallback(
    async (overrides = {}, { quiet = false } = {}) => {
      const next = { ...form, ...overrides };
      const found = validate(next);

      if (Object.keys(found).length > 0) {
        setErrors(found);
        toast.error('Check the highlighted fields', 'Some details still need attention.');
        return null;
      }

      setSaving(true);
      try {
        const result = isEdit
          ? await api.admin.update(id, payload(next))
          : await api.admin.create(payload(next));

        upsert(result.project);
        clearDraft(id);
        setRestored(false);
        setForm(toForm(result.project));
        setErrors({});
        // Callers that raise their own confirmation pass quiet, so a single
        // action never stacks two contradictory toasts.
        if (!quiet) toast.success(result.message ?? 'Saved.');
        return result.project;
      } catch (error) {
        if (error.status === 401) throw error;
        setErrors(error.fields ?? {});
        toast.fromError(error, 'Could not save the project.');
        return null;
      } finally {
        setSaving(false);
      }
    },
    [form, validate, isEdit, id, payload, upsert, toast],
  );

  const publish = async () => {
    const project = await save({ status: 'published' }, { quiet: true });
    if (!project) return;

    toast.success('Project published successfully.');
    refresh();

    if (!isEdit) {
      navigate(`/admin/projects/edit/${project.id}`, { replace: true });
    }
  };

  if (loading) return <LoadingBlock label="Loading project…" />;

  const featuredLimitReached = stats.featured >= maxFeatured;

  return (
    <>
      <header className="admin-head">
        <div>
          <h1 className="admin-title">{isEdit ? 'Edit Project' : 'Add Project'}</h1>
          <p className="admin-subtitle">
            {isEdit
              ? 'Changes go live on your portfolio as soon as you save and publish.'
              : 'Fill in what you know — you can save a draft and finish later.'}
          </p>
        </div>

        <div className="admin-head-actions">
          <Link className="btn btn-ghost" to="/admin/projects/list">
            ← All projects
          </Link>
          <button type="button" className="btn btn-ghost" onClick={() => setPreview(true)}>
            Preview Project
          </button>
        </div>
      </header>

      {restored ? (
        <div className="banner" style={{ marginBottom: '1.25rem' }}>
          <span aria-hidden="true">↺</span>
          <span style={{ flex: 1 }}>
            Unsaved changes from your last session were restored.
          </span>
          <button
            type="button"
            className="btn btn-quiet btn-sm"
            onClick={() => {
              clearDraft(id);
              setRestored(false);
              if (isEdit) {
                api.admin.get(id).then(({ project }) => setForm(toForm(project)));
              } else {
                setForm(emptyForm);
              }
            }}
          >
            Discard
          </button>
        </div>
      ) : null}

      {errors.title || errors.year || errors.githubUrl || errors.demoUrl ? (
        <div className="banner banner-error" style={{ marginBottom: '1.25rem' }}>
          <span aria-hidden="true">⚠</span>
          <span>Please fix the highlighted fields before saving.</span>
        </div>
      ) : null}

      <div className="form-stack">
        {/* ------------------------------------------------ basics */}
        <section className="form-section">
          <h2 className="form-section-title">Basics</h2>

          <div className="form-grid">
            <div className="field span-2">
              <label className="field-label" htmlFor="title">
                Project title <span className="req">*</span>
              </label>
              <input
                id="title"
                className={`input ${errors.title ? 'has-error' : ''}`}
                value={form.title}
                onChange={(event) => set({ title: event.target.value })}
                placeholder="AI-Enabled Smart Trash Bin with Sensor and Image Detection"
                maxLength={140}
                aria-invalid={Boolean(errors.title)}
              />
              <div className="field-hint">
                {form.title.length}/140 characters · this becomes the card headline and page title
              </div>
              {errors.title ? <span className="field-error">⚠ {errors.title}</span> : null}
            </div>

            <div className="field span-2">
              <label className="field-label" htmlFor="short">
                Short description
              </label>
              <textarea
                id="short"
                className={`textarea ${errors.shortDescription ? 'has-error' : ''}`}
                style={{ minHeight: 78 }}
                value={form.shortDescription}
                onChange={(event) => set({ shortDescription: event.target.value })}
                placeholder="One or two sentences shown on the project card."
                maxLength={320}
              />
              <div className="field-hint">{form.shortDescription.length}/320 characters</div>
              {errors.shortDescription ? (
                <span className="field-error">⚠ {errors.shortDescription}</span>
              ) : null}
            </div>

            <div className="field span-2">
              <label className="field-label" htmlFor="full">
                Full description
              </label>
              <textarea
                id="full"
                className="textarea"
                style={{ minHeight: 190 }}
                value={form.fullDescription}
                onChange={(event) => set({ fullDescription: event.target.value })}
                placeholder="The full case study. Leave a blank line between paragraphs."
                maxLength={8000}
              />
              <div className="field-hint">{form.fullDescription.length}/8000 characters</div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ classification */}
        <section className="form-section">
          <h2 className="form-section-title">Classification</h2>

          <div className="form-grid">
            <div className="field span-2">
              <span className="field-label">
                Project category <span className="req">*</span>
              </span>
              <div className="chip-select">
                {meta.categories.map((category) => (
                  <button
                    type="button"
                    key={category}
                    className={`chip-option ${
                      form.categories.includes(category) ? 'selected' : ''
                    }`.trim()}
                    onClick={() => toggleCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <div className="field-hint">
                Select up to 4. The first one selected is used as the primary category.
            </div>
              {errors.categories ? (
                <span className="field-error">⚠ {errors.categories}</span>
              ) : null}
            </div>

            <div className="field">
              <label className="field-label" htmlFor="role">
                My role
              </label>
              <input
                id="role"
                className="input"
                list="role-options"
                value={form.role}
                onChange={(event) => set({ role: event.target.value })}
                placeholder="Developer"
                maxLength={80}
              />
              <datalist id="role-options">
                {meta.roles.map((role) => (
                  <option key={role} value={role} />
                ))}
              </datalist>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="year">
                Project year
              </label>
              <input
                id="year"
                className={`input ${errors.year ? 'has-error' : ''}`}
                type="number"
                inputMode="numeric"
                min="1990"
                max={new Date().getFullYear() + 1}
                value={form.year}
                onChange={(event) => set({ year: event.target.value })}
                placeholder="2026"
                aria-invalid={Boolean(errors.year)}
              />
              {errors.year ? <span className="field-error">⚠ {errors.year}</span> : null}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ tech & features */}
        <section className="form-section">
          <h2 className="form-section-title">Technologies &amp; features</h2>

          <div className="field">
            <span className="field-label">Technologies</span>
            <TagInput
              value={form.technologies}
              onChange={(technologies) => set({ technologies })}
              suggestions={meta.technologies}
              placeholder="React.js, Node.js, Python…"
            />
          </div>

          <div className="field">
            <span className="field-label">Key features</span>
            <TagInput
              value={form.keyFeatures}
              onChange={(keyFeatures) => set({ keyFeatures })}
              suggestions={FEATURE_SUGGESTIONS}
              placeholder="Waste Classification, Image Detection…"
            />
          </div>
        </section>

        {/* ------------------------------------------------ media */}
        <section className="form-section">
          <h2 className="form-section-title">Images &amp; video</h2>

          <ImageUploader
            value={form.thumbnailUrl}
            onChange={(thumbnailUrl) => set({ thumbnailUrl })}
            gallery={form.gallery}
            onGalleryChange={(gallery) => set({ gallery })}
          />

          <div className="field">
            <label className="field-label" htmlFor="video">
              Video <span className="faint">(optional)</span>
            </label>
            <input
              id="video"
              className={`input ${errors.videoUrl ? 'has-error' : ''}`}
              value={form.videoUrl}
              onChange={(event) => set({ videoUrl: event.target.value })}
              placeholder="https://www.youtube.com/watch?v=… or https://youtu.be/…"
            />
            <div className="field-hint">
              YouTube, Vimeo or a direct <code>.mp4</code> / <code>.webm</code> link.
            </div>
            {errors.videoUrl ? <span className="field-error">⚠ {errors.videoUrl}</span> : null}
          </div>
        </section>

        {/* ------------------------------------------------ links */}
        <section className="form-section">
          <h2 className="form-section-title">Links</h2>

          <div className="form-grid">
            <div className="field">
              <label className="field-label" htmlFor="github">
                GitHub URL
              </label>
              <input
                id="github"
                className={`input ${errors.githubUrl ? 'has-error' : ''}`}
                value={form.githubUrl}
                onChange={(event) => set({ githubUrl: event.target.value })}
                placeholder="https://github.com/you/project"
                aria-invalid={Boolean(errors.githubUrl)}
              />
              {errors.githubUrl ? <span className="field-error">⚠ {errors.githubUrl}</span> : null}
            </div>

            <div className="field">
              <label className="field-label" htmlFor="demo">
                Live demo URL
              </label>
              <input
                id="demo"
                className={`input ${errors.demoUrl ? 'has-error' : ''}`}
                value={form.demoUrl}
                onChange={(event) => set({ demoUrl: event.target.value })}
                placeholder="https://your-project.vercel.app"
                aria-invalid={Boolean(errors.demoUrl)}
              />
              {errors.demoUrl ? <span className="field-error">⚠ {errors.demoUrl}</span> : null}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ publishing */}
        <section className="form-section">
          <h2 className="form-section-title">Publishing</h2>

          <div className="field">
            <span className="field-label">Project status</span>
            <div className="segmented" role="group" aria-label="Project status">
              <button
                type="button"
                className={form.status === 'draft' ? 'active' : ''}
                onClick={() => set({ status: 'draft' })}
              >
                Draft
              </button>
              <button
                type="button"
                className={form.status === 'published' ? 'active' : ''}
                onClick={() => set({ status: 'published' })}
              >
                Published
              </button>
            </div>
            <div className="field-hint">
              Drafts never appear on the public site.
            </div>
          </div>

          <div
            className={`toggle-row ${form.featured ? 'is-on' : ''}`.trim()}
            role="switch"
            aria-checked={form.featured}
            tabIndex={0}
            onClick={() => {
              if (!form.featured && featuredLimitReached && !isEdit) {
                toast.error('Featured limit reached', `Only ${maxFeatured} projects can be featured.`);
                return;
              }
              set({ featured: !form.featured });
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                event.currentTarget.click();
              }
            }}
          >
            <span className="toggle-text">
              <strong>Featured Project</strong>
              <span>
                {form.featured
                  ? 'Shown in the featured section on your home page.'
                  : featuredLimitReached
                    ? `Limit reached — unfeature another project first (max ${maxFeatured}).`
                    : 'Highlight this project on your home page.'}
              </span>
            </span>
            <span className="switch" aria-hidden="true" />
          </div>
        </section>
      </div>

      <div className="sticky-actions">
        {savedAt ? (
          <span className="autosave-note spacer">
            <span className="dot-live" aria-hidden="true" />
            Draft autosaved locally
          </span>
        ) : (
          <span className="spacer" />
        )}

        {isEdit ? (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => save()}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        ) : null}

        <button
          type="button"
          className="btn btn-primary"
          onClick={publish}
          disabled={saving}
        >
          {saving ? 'Working…' : form.status === 'published' ? 'Save & Publish' : 'Publish Project'}
        </button>
      </div>

      {preview ? (
        <div className="preview-shell" role="dialog" aria-modal="true" aria-label="Project preview">
          <div className="preview-bar">
            <div>
              <div className="preview-label">Preview · exactly how it will appear</div>
              <div style={{ fontSize: '0.88rem', marginTop: '0.15rem' }}>
                {form.title || 'Untitled project'}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setPreview(false)}
            >
              Close Preview
            </button>
          </div>

          <div style={{ padding: '2rem 0 4rem' }}>
            <div className="container">
              <div className="tag-list" style={{ marginBottom: '1rem' }}>
                {form.featured ? <span className="tag">★ Featured</span> : null}
                {form.categories.map((category) => (
                  <span className="tag" key={category}>
                    {category}
                  </span>
                ))}
              </div>

              <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', maxWidth: '22ch' }}>
                {form.title || 'Untitled project'}
              </h1>

              {form.shortDescription ? (
                <p className="lede" style={{ marginTop: '1rem' }}>
                  {form.shortDescription}
                </p>
              ) : null}

              <div className="detail-hero-image">
                {form.thumbnailUrl ? (
                  <img src={form.thumbnailUrl} alt="" />
                ) : (
                  <div
                    className="project-media-fallback"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: gradientFor(form.title || 'preview'),
                      fontSize: '4rem',
                    }}
                    aria-hidden="true"
                  >
                    {initials(form.title)}
                  </div>
                )}
              </div>

              <div className="detail-grid">
                <div className="detail-main">
                  {form.fullDescription ? (
                    form.fullDescription
                      .split(/\n{2,}/)
                      .map((block, index) => <p key={index}>{block}</p>)
                  ) : (
                    <p className="muted">No full description yet.</p>
                  )}

                  {form.keyFeatures.length > 0 ? (
                    <>
                      <h2>Key features</h2>
                      <ul className="feature-list">
                        {form.keyFeatures.map((feature) => (
                          <li key={feature}>{feature}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}

                  {form.videoUrl && (youtubeEmbedUrl(form.videoUrl) || vimeoEmbedUrl(form.videoUrl) || isVideoFile(form.videoUrl)) ? (
                    <>
                      <h2>Demonstration</h2>
                      <div className="video-frame">
                        {youtubeEmbedUrl(form.videoUrl) ? (
                          <iframe
                            src={youtubeEmbedUrl(form.videoUrl)}
                            title="Video preview"
                            allowFullScreen
                          />
                        ) : vimeoEmbedUrl(form.videoUrl) ? (
                          <iframe src={vimeoEmbedUrl(form.videoUrl)} title="Video preview" allowFullScreen />
                        ) : (
                          <video src={form.videoUrl} controls preload="metadata" />
                        )}
                      </div>
                    </>
                  ) : null}

                  {form.gallery.length > 0 ? (
                    <>
                      <h2>Gallery</h2>
                      <div className="gallery">
                        {form.gallery.map((url) => (
                          <figure key={url}>
                            <img src={url} alt="" />
                          </figure>
                        ))}
                      </div>
                    </>
                  ) : null}

                  {form.technologies.length > 0 ? (
                    <>
                      <h2>Technology stack</h2>
                      <div className="tag-list">
                        {form.technologies.map((tech) => (
                          <span className="tag" key={tech}>
                            {tech}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>

                <aside className="detail-aside">
                  <div className="fact">
                    <span className="fact-label">Role</span>
                    <span className="fact-value">{form.role || '—'}</span>
                  </div>
                  <div className="fact">
                    <span className="fact-label">Year</span>
                    <span className="fact-value">{form.year || '—'}</span>
                  </div>
                  <div className="fact">
                    <span className="fact-label">Category</span>
                    <span className="fact-value">{form.categories.join(', ')}</span>
                  </div>

                  <hr className="divider" />

                  {form.githubUrl ? (
                    <span className="btn btn-ghost btn-sm">View source on GitHub</span>
                  ) : null}
                  {form.demoUrl ? (
                    <span className="btn btn-ghost btn-sm">Open live demo</span>
                  ) : null}
                </aside>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function loadDraft(id) {
  try {
    const raw = window.localStorage.getItem(draftKey(id));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearDraft(id) {
  try {
    window.localStorage.removeItem(draftKey(id));
  } catch {
    /* nothing to clean up */
  }
}