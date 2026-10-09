import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from 'shared/lib/api.js';
import { useAdminAuth } from './AdminAuthContext.js';
import { useProjects } from './ProjectsProvider.jsx';
import { useToast } from 'shared/components/Toast.jsx';
import { relativeTime } from '../lib/format.js';

/**
 * Settings — session information and the security posture of the install.
 * Deliberately read-only: no configuration is editable from the browser, so a
 * stolen session cannot reconfigure the server.
 */
export default function AdminSettings() {
  const { signOut, expiresAt } = useAdminAuth();
  const { stats, maxFeatured } = useProjects();
  const toast = useToast();
  const [health, setHealth] = useState(null);
  const [resumeUrl, setResumeUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    fetch('/api/health', { credentials: 'include' })
      .then((response) => response.json())
      .then(setHealth)
      .catch(() => setHealth({ ok: false }));

    api.getMeta()
      .then((m) => setResumeUrl(m.resumeUrl || ''))
      .catch(() => {});
  }, []);

  const endEverywhere = async () => {
    try {
      await api.logoutEverywhere();
      toast.success('All sessions ended. Please sign in again.');
      await signOut();
    } catch (error) {
      toast.fromError(error, 'Could not end sessions.');
    }
  };

  return (
    <>
      <header className="admin-head">
        <div>
          <h1 className="admin-title">Settings</h1>
          <p className="admin-subtitle">Session details and how this install is configured.</p>
        </div>
        <div className="admin-head-actions">
          <Link className="btn btn-ghost" to="/admin/projects">
            Dashboard
          </Link>
        </div>
      </header>

      <div className="form-stack">
        <section className="form-section">
          <h2 className="form-section-title">Current session</h2>

          <div className="kv">
            <span>Signed in as</span>
            <span>Owner</span>
          </div>
          <div className="kv">
            <span>Session expires</span>
            <span>{expiresAt ? new Date(expiresAt).toLocaleString() : '—'}</span>
          </div>
          <div className="kv">
            <span>Storage</span>
            <span>{health?.storage ?? '—'}</span>
          </div>
          <div className="kv">
            <span>Database</span>
            <span>{health?.database ?? '—'}</span>
          </div>
          <div className="kv">
            <span>Environment</span>
            <span>{health?.env ?? '—'}</span>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={signOut}>
              Logout
            </button>
            <button type="button" className="btn btn-quiet btn-sm" onClick={endEverywhere}>
              End all sessions
            </button>
          </div>
        </section>

        <section className="form-section">
          <h2 className="form-section-title">Resume</h2>
          <p className="field-hint">Upload a PDF to display the "Download Resume" button on the public site.</p>

          <div className="field">
            <div
              className={`dropzone ${uploading ? 'is-busy' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click();
              }}
            >
              <div className="dropzone-icon" aria-hidden="true">
                {uploading ? '⏳' : '⬆'}
              </div>
              <div className="dropzone-title">{uploading ? 'Uploading…' : 'Drop resume PDF here'}</div>
              <div className="dropzone-hint">or click to upload · PDF, up to 8 MB</div>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setUploading(true);
                  try {
                    const r = await api.admin.uploadResume(f);
                    setResumeUrl(r.url);
                    toast.success('Resume uploaded');
                  } catch (err) {
                    toast.fromError(err, 'Upload failed. Please try again.');
                  } finally {
                    setUploading(false);
                    if (fileRef.current) fileRef.current.value = '';
                  }
                }}
              />
            </div>

            {resumeUrl ? (
              <div className="kv" style={{ marginTop: '0.75rem' }}>
                <span>Current resume</span>
                <span>
                  <a href={resumeUrl} target="_blank" rel="noreferrer">
                    View
                  </a>
                </span>
              </div>
            ) : null}

            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
              {resumeUrl ? (
                <button
                  type="button"
                  className="btn btn-quiet btn-sm"
                  onClick={async () => {
                    try {
                      await api.admin.clearResume();
                      setResumeUrl('');
                      toast.success('Resume removed');
                    } catch (err) {
                      toast.fromError(err, 'Could not remove resume.');
                    }
                  }}
                >
                  Remove resume
                </button>
              ) : null}
              <a className="btn btn-ghost btn-sm" href={resumeUrl} target="_blank" rel="noreferrer" style={{ display: resumeUrl ? 'inline-flex' : 'none' }}>
                Download
              </a>
            </div>
          </div>
        </section>

        <section className="form-section">
          <h2 className="form-section-title">Content limits</h2>

          <div className="kv">
            <span>Total projects</span>
            <span>{stats.total}</span>
          </div>
          <div className="kv">
            <span>Featured projects</span>
            <span>
              {stats.featured} / {maxFeatured}
            </span>
          </div>
          <div className="kv">
            <span>Drafts hidden from visitors</span>
            <span>{stats.drafts}</span>
          </div>
        </section>

        <section className="form-section">
          <h2 className="form-section-title">Security notes</h2>

          <ul className="feature-list">
            <li>
              The admin PIN is stored on the server as a bcrypt hash and never reaches the browser.
            </li>
            <li>
              Your session lives in an HTTP-only cookie, so JavaScript cannot read or copy it.
            </li>
            <li>
              Failed PIN attempts are rate-limited per device and are rejected server-side.
            </li>
            <li>
              All write endpoints require a valid session — access is never checked in React.
            </li>
            <li>Uploaded images are verified by their actual bytes, not the file extension.</li>
          </ul>

          <div className="banner">
            <span aria-hidden="true">⚙</span>
            <span>
              To change the PIN, stop the server, run <code>npm run pin:hash</code>, paste the
              result into <code>server/.env</code> as <code>ADMIN_PIN_HASH</code>, then restart.
            </span>
          </div>
        </section>

        <section className="form-section">
          <h2 className="form-section-title">Links</h2>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <Link className="btn btn-ghost btn-sm" to="/">
              View public site
            </Link>
            <Link className="btn btn-ghost btn-sm" to="/admin/projects/list">
              Edit Projects
            </Link>
          </div>
          <p className="field-hint">Session started {relativeTime(new Date().toISOString())}.</p>
        </section>
      </div>
    </>
  );
}