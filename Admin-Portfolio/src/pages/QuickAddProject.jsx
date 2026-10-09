import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from 'shared/components/Icon.jsx';
import ImageUploader from '../components/ImageUploader.jsx';
import TagInput from '../components/TagInput.jsx';
import api from 'shared/lib/api.js';
import { useProjects } from './ProjectsProvider.jsx';
import { useToast } from 'shared/components/Toast.jsx';

/**
 * Simplified "Add New Project" form.
 *
 * This is the fast path described in the upload brief: image, name, live link,
 * repository, description, technologies, status and featured — nothing else.
 * Everything it collects maps onto the same API and database as the detailed
 * editor, so a project created here behaves identically to one created in
 * ProjectForm and never needs a source-code change to appear on the site.
 *
 * The detailed editor stays available at /admin/projects/edit/:id for case-study
 * blocks, galleries and key features.
 */

const FALLBACK_TECHS = [
  'React.js', 'Node.js', 'JavaScript', 'HTML5', 'CSS3', 'PHP', 'MySQL',
  'Firebase', 'Python', 'Flask', 'ESP32-S3', 'ESP32-CAM', 'Figma',
];

const emptyForm = {
  title: '',
  websiteUrl: '',
  githubUrl: '',
  description: '',
  technologies: [],
  thumbnailUrl: '',
  status: 'draft',
  featured: false,
};

/**
 * Card previews are capped at 320 characters by the API, so a long description is
 * trimmed to a sensible summary for the card while the detail page keeps the
 * full text. Cutting on a word boundary avoids "engi…" style truncation.
 */
export function deriveShortDescription(full, limit = 200) {
  const text = String(full ?? '').trim().replace(/\s+/g, ' ');
  if (text.length <= limit) return text;

  const slice = text.slice(0, limit);
  const lastSpace = slice.lastIndexOf(' ');
  return `${(lastSpace > limit * 0.6 ? slice.slice(0, lastSpace) : slice).trimEnd()}…`;
}

/** Accepts `example.com` as well as a full URL, since that is what people paste. */
function normalizeUrl(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return raw;
  return `https://${raw}`;
}

function urlError(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  try {
    const { protocol } = new URL(normalizeUrl(raw));
    return protocol === 'https:' || protocol === 'http:' ? null : 'Enter a full http(s) URL.';
  } catch {
    return 'Enter a full URL starting with https://';
  }
}

export default function QuickAddProject() {
  const navigate = useNavigate();
  const toast = useToast();
  const { upsert, refresh, maxFeatured, stats } = useProjects();

  const [form, setForm] = useState(emptyForm);
  const [suggestions, setSuggestions] = useState(FALLBACK_TECHS);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .getMeta()
      .then((catalog) => {
        if (Array.isArray(catalog.technologies) && catalog.technologies.length > 0) {
          setSuggestions(catalog.technologies);
        }
      })
      .catch(() => {});
  }, []);

  const set = useCallback((patch) => {
    setForm((current) => ({ ...current, ...patch }));
    setErrors((current) => {
      const next = { ...current };
      for (const key of Object.keys(patch)) delete next[key];
      return next;
    });
  }, []);

  /**
   * `publishing` decides how strict the form is. A draft only needs a name, so
   * half-finished work can be parked; publishing requires the image and both
   * links, because those are what the public card and detail page render.
   */
  const validate = useCallback((state, publishing) => {
    const found = {};

    if (!state.title.trim()) found.title = 'Project name is required.';

    for (const [key, value] of [
      ['websiteUrl', state.websiteUrl],
      ['githubUrl', state.githubUrl],
    ]) {
      const problem = urlError(value);
      if (problem) found[key] = problem;
    }

    if (publishing) {
      if (!state.thumbnailUrl) {
        found.thumbnailUrl = 'Add a project image before publishing.';
      }
      if (!state.websiteUrl.trim()) {
        found.websiteUrl = 'Add your live website URL before publishing.';
      }
      if (!state.githubUrl.trim()) {
        found.githubUrl = 'Add your GitHub repository URL before publishing.';
      }
    }

    return found;
  }, []);

  const save = useCallback(
    async (status) => {
      const publishing = status === 'published';
      const found = validate(form, publishing);

      if (Object.keys(found).length > 0) {
        setErrors(found);
        toast.error(
          'Check the highlighted fields',
          publishing
            ? 'An image, name and both links are needed to publish.'
            : 'Some details still need attention.',
        );
        return;
      }

      const description = form.description.trim();
      const payload = {
        title: form.title.trim(),
        shortDescription: deriveShortDescription(description),
        fullDescription: description,
        technologies: form.technologies,
        websiteUrl: form.websiteUrl.trim() ? normalizeUrl(form.websiteUrl) : null,
        githubUrl: form.githubUrl.trim() ? normalizeUrl(form.githubUrl) : null,
        thumbnailUrl: form.thumbnailUrl || null,
        status,
        featured: form.featured,
      };

      setSaving(true);
      try {
        const result = await api.admin.create(payload);
        upsert(result.project);
        refresh();
        setErrors({});

        if (publishing) {
          toast.success('Project published successfully.');
        } else {
          toast.success('Draft saved.');
        }

        navigate('/admin/projects/list');
      } catch (error) {
        if (error.status === 401) throw error;
        setErrors(error.fields ?? {});
        toast.fromError(error, 'Could not save the project.');
      } finally {
        setSaving(false);
      }
    },
    [form, validate, upsert, refresh, toast, navigate],
  );

  const featuredLimitReached = stats.featured >= maxFeatured;

  return (
    <form
      className="quick-add"
      onSubmit={(event) => {
        event.preventDefault();
        save('published');
      }}
      noValidate
    >
      <header className="admin-head">
        <div>
          <h1 className="admin-title">Add New Project</h1>
          <p className="admin-subtitle">
            Fill in the essentials and publish — it appears on your portfolio immediately.
          </p>
        </div>
        <div className="admin-head-actions">
          <Link className="btn btn-quiet btn-sm" to="/admin/projects/list">
            Cancel
          </Link>
        </div>
      </header>

      <div className="quick-grid">
        <div className="panel quick-media">
          <div className="panel-body">
            <ImageUploader
              value={form.thumbnailUrl}
              onChange={(url) => set({ thumbnailUrl: url })}
              label="PROJECT IMAGE"
              hint="Required to publish. Shown on the card and at the top of the detail page."
              invalid={Boolean(errors.thumbnailUrl)}
            />
            {errors.thumbnailUrl ? (
              <span className="field-error">{errors.thumbnailUrl}</span>
            ) : null}
          </div>
        </div>

        <div className="panel quick-details">
          <div className="panel-body form-stack">
            <div className="field">
              <label className="field-label" htmlFor="qa-title">
                Project Name <span className="req">*</span>
              </label>
              <input
                id="qa-title"
                className={`input ${errors.title ? 'has-error' : ''}`.trim()}
                value={form.title}
                onChange={(event) => set({ title: event.target.value })}
                placeholder="Binbot"
                autoComplete="off"
                aria-invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? 'qa-title-error' : undefined}
              />
              {errors.title ? (
                <span className="field-error" id="qa-title-error">
                  {errors.title}
                </span>
              ) : (
                <span className="field-hint">For example: Binbot, Vendura Atterra, Expense Tracker.</span>
              )}
            </div>

            <div className="field">
              <label className="field-label" htmlFor="qa-website">
                Live Website URL
              </label>
              <div className="input-icon">
                <Icon name="globe" size={17} />
                <input
                  id="qa-website"
                  className={`input has-icon ${errors.websiteUrl ? 'has-error' : ''}`.trim()}
                  value={form.websiteUrl}
                  onChange={(event) => set({ websiteUrl: event.target.value })}
                  placeholder="https://yourwebsite.com"
                  inputMode="url"
                  autoComplete="url"
                  aria-invalid={Boolean(errors.websiteUrl)}
                  aria-describedby={errors.websiteUrl ? 'qa-website-error' : 'qa-website-hint'}
                />
              </div>
              {errors.websiteUrl ? (
                <span className="field-error" id="qa-website-error">
                  {errors.websiteUrl}
                </span>
              ) : (
                <span className="field-hint" id="qa-website-hint">
                  Paste the address of the site you deployed.
                </span>
              )}
            </div>

            <div className="field">
              <label className="field-label" htmlFor="qa-github">
                GitHub Repository URL
              </label>
              <div className="input-icon">
                <Icon name="github" size={17} />
                <input
                  id="qa-github"
                  className={`input has-icon ${errors.githubUrl ? 'has-error' : ''}`.trim()}
                  value={form.githubUrl}
                  onChange={(event) => set({ githubUrl: event.target.value })}
                  placeholder="https://github.com/username/repository"
                  inputMode="url"
                  autoComplete="off"
                  aria-invalid={Boolean(errors.githubUrl)}
                  aria-describedby={errors.githubUrl ? 'qa-github-error' : undefined}
                />
              </div>
              {errors.githubUrl ? (
                <span className="field-error" id="qa-github-error">
                  {errors.githubUrl}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-body form-stack">
          <div className="field">
            <label className="field-label" htmlFor="qa-description">
              Project Description
            </label>
            <textarea
              id="qa-description"
              className="textarea"
              value={form.description}
              onChange={(event) => set({ description: event.target.value })}
              placeholder="What does it do, and what did you build?"
              rows={4}
            />
            <span className="field-hint">
              Optional. The first line becomes the short summary on the project card.
            </span>
          </div>

          <div className="field">
            <span className="field-label">Technologies</span>
            <TagInput
              id="qa-technologies"
              value={form.technologies}
              onChange={(technologies) => set({ technologies })}
              suggestions={suggestions}
              placeholder="Type a technology and press Enter"
            />
            <span className="field-hint">
              Press Enter or comma to add. Click a tag’s × to remove it.
            </span>
          </div>

          <div className="quick-meta">
            <div className="field">
              <span className="field-label">Project Status</span>
              <div className="segmented" role="radiogroup" aria-label="Project status">
                {['draft', 'published'].map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={form.status === value}
                    className={`segment ${form.status === value ? 'is-active' : ''}`.trim()}
                    onClick={() => set({ status: value })}
                  >
                    {value === 'draft' ? 'Draft' : 'Published'}
                  </button>
                ))}
              </div>
              <span className="field-hint">
                Drafts stay private to the Project Manager until you publish them.
              </span>
            </div>

            <div className="field">
              <span className="field-label">Featured</span>
              <button
                type="button"
                className={`toggle-row ${form.featured ? 'is-on' : ''}`.trim()}
                role="switch"
                aria-checked={form.featured}
                onClick={() => {
                  if (!form.featured && featuredLimitReached) {
                    toast.error(
                      'Featured limit reached',
                      `Only ${maxFeatured} projects can be featured at once.`,
                    );
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
                  <strong>Set as Featured Project</strong>
                  <span>
                    {form.featured
                      ? 'Shown in the featured section on your home page.'
                      : featuredLimitReached
                        ? `Limit reached — unfeature another project first (max ${maxFeatured}).`
                        : 'Give this project the large spotlight on your home page.'}
                  </span>
                </span>
                <span className="switch" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <p className="quick-actions-note">
          Need case-study blocks, a gallery or key features? Save first, then use
          Edit in the Projects list.
        </p>
        <div className="quick-actions-buttons">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={saving}
            onClick={() => navigate('/admin/projects/list')}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-quiet"
            disabled={saving}
            onClick={() => save('draft')}
          >
            Save Draft
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Publishing…' : 'Publish Project'}
          </button>
        </div>
      </div>
    </form>
  );
}