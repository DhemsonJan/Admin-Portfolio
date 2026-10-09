import { createContext, useContext } from 'react';

/**
 * Auth state shared by the CMS screens.
 *
 * Lives in its own module so AdminGate and AdminRoutes do not have to import
 * each other, which would create a circular dependency.
 */
export const AdminAuthContext = createContext(null);

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error('useAdminAuth must be used inside the authenticated CMS shell');
  return context;
}

export default AdminAuthContext;