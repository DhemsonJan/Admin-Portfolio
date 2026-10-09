/**
 * The dashboard (public portfolio) lives on the same deployment in production
 * but on its own dev server, so cross-app links need an origin in development.
 */
const DASHBOARD_DEV_ORIGIN = 'http://localhost:5173';

export const dashboardHref = import.meta.env.DEV ? `${DASHBOARD_DEV_ORIGIN}/` : '/';
