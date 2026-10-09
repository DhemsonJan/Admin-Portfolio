import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAdminAuth } from './AdminAuthContext.js';
import { dashboardHref } from '../links.js';

const NAV = [
  { to: '/admin/projects', end: true, icon: '◧', label: 'Dashboard' },
  { to: '/admin/projects/list', icon: '☰', label: 'Projects' },
  { to: '/admin/projects/new', icon: '＋', label: 'Upload Project' },
  { to: '/admin/projects/settings', icon: '⚙', label: 'Settings' },
];

export default function AdminLayout() {
  const { signOut } = useAdminAuth();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" to="/admin/projects">
          <span className="brand-mark" aria-hidden="true">
            N
          </span>
          <span>
            Project Manager
            <small>PRIVATE CMS</small>
          </span>
        </Link>

        <nav className="admin-nav" aria-label="Project Manager">
          <span className="admin-nav-label">Manage</span>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`.trim()}
            >
              <span className="admin-nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-foot">
          <div className="admin-user">
            <span className="avatar" aria-hidden="true">
              N
            </span>
            <span>
              Owner
              <br />
              <span className="faint" style={{ fontSize: '0.72rem' }}>
                signed in
              </span>
            </span>
          </div>

          <a className="btn btn-ghost btn-sm" href={dashboardHref} style={{ width: '100%' }}>
            View public site
          </a>

          <button
            type="button"
            className="btn btn-quiet btn-sm"
            onClick={signOut}
            style={{ width: '100%', color: 'var(--danger)' }}
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}