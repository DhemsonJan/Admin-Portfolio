import { useCallback, useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import api from 'shared/lib/api.js';
import { LoadingBlock } from 'shared/components/Spinner.jsx';
import AdminLogin from './AdminLogin.jsx';
import ProjectsProvider from './ProjectsProvider.jsx';
import { AdminAuthContext } from './AdminAuthContext.js';

/**
 * Gate for every /admin route.
 *
 * Authentication is decided by the server: this component only asks whether the
 * HTTP-only session cookie is still valid. There is no client-side PIN check and
 * no token held in JavaScript — the browser cannot read the cookie.
 *
 * Rendered as a parent route, so the authenticated screens come through
 * <Outlet /> and stay part of the same routing tree.
 */
export default function AdminGate() {
  const [status, setStatus] = useState('checking');
  const [expiresAt, setExpiresAt] = useState(null);
  const navigate = useNavigate();

  const check = useCallback(async () => {
    try {
      const result = await api.session();
      setExpiresAt(result.authenticated ? result.expiresAt : null);
      setStatus(result.authenticated ? 'authed' : 'anon');
      return result.authenticated;
    } catch {
      setStatus('anon');
      return false;
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  const signOut = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setStatus('anon');
      navigate('/');
    }
  }, [navigate]);

  /** A 401 anywhere in the CMS means the session expired mid-use. */
  const invalidate = useCallback(() => setStatus('anon'), []);

  if (status === 'checking') {
    return (
      <div className="gate">
        <div className="ambient" aria-hidden="true" />
        <LoadingBlock label="Checking session…" />
      </div>
    );
  }

  if (status === 'anon') {
    return (
      <AdminLogin
        onAuthenticated={async () => {
          await check();
        }}
      />
    );
  }

  return (
    <AdminAuthContext.Provider value={{ signOut, invalidate, expiresAt }}>
      <ProjectsProvider>
        <Outlet />
      </ProjectsProvider>
    </AdminAuthContext.Provider>
  );
}