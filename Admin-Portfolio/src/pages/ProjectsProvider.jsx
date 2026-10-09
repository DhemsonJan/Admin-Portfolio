import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from 'shared/lib/api.js';
import { useToast } from 'shared/components/Toast.jsx';
import { useAdminAuth } from './AdminAuthContext.js';

/**
 * Owns one copy of the project list for the CMS.
 *
 * Every mutation updates this cache, so the dashboard, the list, drag-and-drop
 * ordering and the forms all stay consistent without each screen refetching.
 */

const ProjectsContext = createContext(null);

export function useProjects() {
  const context = useContext(ProjectsContext);
  if (!context) throw new Error('useProjects must be used inside the CMS shell');
  return context;
}

export default function ProjectsProvider({ children }) {
  const toast = useToast();
  const { invalidate } = useAdminAuth();

  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0, featured: 0 });
  const [maxFeatured, setMaxFeatured] = useState(3);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [list, summary] = await Promise.all([api.admin.list(), api.admin.stats()]);
      setProjects(list.projects);
      setStats(summary.stats);
      setMaxFeatured(summary.maxFeatured ?? 3);
    } catch (error) {
      if (error.status === 401) {
        invalidate();
        return;
      }
      toast.fromError(error, 'Could not load your projects.');
    } finally {
      setLoading(false);
    }
  }, [toast, invalidate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Recomputes the dashboard counters so toggles feel instant. */
  const applyList = useCallback((updater) => {
    setProjects((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      setStats({
        total: next.length,
        published: next.filter((project) => project.status === 'published').length,
        drafts: next.filter((project) => project.status === 'draft').length,
        featured: next.filter((project) => project.featured).length,
      });
      return next;
    });
  }, []);

  const upsert = useCallback(
    (project) => {
      applyList((current) => {
        const exists = current.some((item) => item.id === project.id);
        const next = exists
          ? current.map((item) => (item.id === project.id ? project : item))
          : [...current, project];
        return [...next].sort((a, b) => a.sortOrder - b.sortOrder);
      });
    },
    [applyList],
  );

  const patchLocal = useCallback(
    (id, patch) => {
      applyList((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    },
    [applyList],
  );

  const remove = useCallback(
    (id) => {
      applyList((current) => current.filter((item) => item.id !== id));
    },
    [applyList],
  );

  return (
    <ProjectsContext.Provider
      value={{ projects, stats, maxFeatured, loading, refresh, upsert, patchLocal, remove }}
    >
      {children}
    </ProjectsContext.Provider>
  );
}