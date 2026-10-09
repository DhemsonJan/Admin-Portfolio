import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home.jsx';
import ProjectDetail from './pages/ProjectDetail.jsx';
import NotFound from './pages/NotFound.jsx';
import { LoadingBlock } from './components/Spinner.jsx';

/**
 * The Project Manager moved to its own app in /Admin-Portfolio (dev port 5174).
 * This route keeps the old /admin/... URL working by handing the browser over
 * to the admin app; in production it points at /admin/ on the same origin.
 */
function AdminRedirect() {
  const to = import.meta.env.DEV ? 'http://localhost:5174/admin/projects' : '/admin/';

  useEffect(() => {
    window.location.replace(to);
  }, [to]);

  return <LoadingBlock label="Opening the Project Manager…" />;
}

export default function App() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading…" />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<Home />} />
        <Route path="/projects/:slug" element={<ProjectDetail />} />

        <Route path="/admin/*" element={<AdminRedirect />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
