import { useEffect, useState } from 'react';
import api from 'shared/lib/api.js';
import { dashboardHref } from '../links.js';

/**
 * PIN gate.
 *
 * The PIN is posted straight to the server and never persisted in React state
 * beyond this form, nor written to localStorage or sessionStorage. On success
 * the server replies with an HTTP-only cookie that JavaScript cannot read.
 */
export default function AdminLogin({ onAuthenticated }) {
  const [pin, setPin] = useState('');
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const submit = async (event) => {
    event.preventDefault();
    if (busy || !pin) return;

    setBusy(true);
    setError('');

    try {
      await api.login(pin);
      setPin('');
      await onAuthenticated();
    } catch (requestError) {
      setError(requestError.message ?? 'Incorrect PIN.');
      setPin('');

      if (requestError.code === 'RATE_LIMITED' && requestError.retryAfterSeconds) {
        setCooldown(requestError.retryAfterSeconds);
      }
    } finally {
      setBusy(false);
    }
  };

  const disabled = busy || !pin || cooldown > 0;

  // Count the lockout down so the button re-enables on its own.
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  return (
    <div className="gate">
      <div className="ambient" aria-hidden="true" />

      <div className="gate-card">
        <div className="gate-mark" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h1 className="gate-title">PROJECT MANAGER</h1>
        <p className="gate-subtitle">Enter your PIN to continue.</p>

        <form onSubmit={submit} noValidate>
          <div className="field">
            <label className="field-label" htmlFor="pin">
              <span className="req">PIN</span>
            </label>

            <div className="pin-field">
              <input
                id="pin"
                className={`input ${error ? 'has-error' : ''}`}
                type={reveal ? 'text' : 'password'}
                inputMode="numeric"
                autoComplete="current-password"
                autoFocus
                value={pin}
                placeholder="••••"
                onChange={(event) => {
                  setPin(event.target.value);
                  if (error) setError('');
                }}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'pin-error' : undefined}
              />
              <button
                type="button"
                className="pin-toggle"
                onClick={() => setReveal((current) => !current)}
                aria-label={reveal ? 'Hide PIN' : 'Show PIN'}
              >
                {reveal ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error ? (
            <div className="gate-error" id="pin-error" role="alert">
              <span aria-hidden="true">⚠</span>
              <span>{error}</span>
            </div>
          ) : null}

          {cooldown > 0 ? (
            <div className="gate-error" role="status">
              <span aria-hidden="true">⏱</span>
              <span>
                Locked out. Try again in {Math.ceil(cooldown / 60)} minute
                {Math.ceil(cooldown / 60) === 1 ? '' : 's'}.
              </span>
            </div>
          ) : null}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1.25rem' }}
            disabled={disabled}
          >
            {busy ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Verifying…
              </>
            ) : (
              'Unlock Dashboard'
            )}
          </button>
        </form>

        <div className="gate-foot">
          This area is private. Sessions expire automatically.
        </div>

        <a className="gate-back" href={dashboardHref}>
          ← Back to portfolio
        </a>
      </div>
    </div>
  );
}