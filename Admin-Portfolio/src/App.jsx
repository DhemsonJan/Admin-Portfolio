import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LoadingBlock } from 'shared/components/Spinner.jsx';

/**
 * The Project Manager is a standalone app that shares components with the
 * dashboard through the `shared` alias. AdminGate is a parent route: it
 * authenticates once, then renders its children through <Outlet />.
 */
const AdminGate = lazy(() => import('./pages/AdminGate.jsx'));
const AdminLayout = lazy(() => import('./pages/AdminLayout.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const ProjectList = lazy(() => import('./pages/ProjectList.jsx'));
const QuickAddProject = lazy(() => import('./pages/QuickAddProject.jsx'));
const ProjectForm = lazy(() => import('./pages/ProjectForm.jsx'));
const AdminSettings = lazy(() => import('./pages/AdminSettings.jsx'));

export default function App() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading…" />}>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/projects" replace />} />

        <Route path="/admin/projects" element={<AdminGate />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="list" element={<ProjectList />} />
            <Route path="new" element={<QuickAddProject />} />
            {/* Detailed editor: case-study blocks, gallery, key features. */}
            <Route path="edit/:id" element={<ProjectForm />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/admin/projects" replace />} />
      </Routes>
    </Suspense>
  );
}
