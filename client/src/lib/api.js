const BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/+$/, '');

/**
 * Thin API wrapper.
 *
 * Every request sends credentials so the server's HTTP-only session cookie
 * travels with it. The PIN is only ever posted to /api/auth/login — it is never
 * stored in React state beyond the current form, and never in localStorage.
 */
async function request(path, { method = 'GET', body, signal, raw = false } = {}) {
  const isFormData = body instanceof FormData;

  const response = await fetch(`${BASE}/api${path}`, {
    method,
    credentials: 'include',
    signal,
    headers: isFormData || !body ? undefined : { 'Content-Type': 'application/json' },
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (raw) {
    if (!response.ok) throw await toError(response);
    return response;
  }

  if (response.status === 204) return null;

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(data?.error ?? `Request failed (${response.status})`);
    error.status = response.status;
    error.code = data?.code;
    error.fields = data?.fields ?? {};
    error.retryAfterSeconds = data?.retryAfterSeconds;
    throw error;
  }

  return data;
}

async function toError(response) {
  let data = null;
  try {
    data = await response.json();
  } catch {
    /* non-JSON error body */
  }
  const error = new Error(data?.error ?? `Request failed (${response.status})`);
  error.status = response.status;
  error.fields = data?.fields ?? {};
  return error;
}

export const api = {
  /* public */
  listPublicProjects: (signal) => request('/projects', { signal }),
  getPublicProject: (slug, signal) => request(`/projects/${encodeURIComponent(slug)}`, { signal }),
  getMeta: (signal) => request('/meta', { signal }),

  /* public contact form */
  sendContact: (payload) => request('/contact', { method: 'POST', body: payload }),

  /* auth */
  session: (signal) => request('/auth/session', { signal }),
  login: (pin) => request('/auth/login', { method: 'POST', body: { pin } }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  logoutEverywhere: () => request('/auth/logout-all', { method: 'POST' }),

  /* admin */
  admin: {
    stats: (signal) => request('/admin/stats', { signal }),
    list: (signal) => request('/admin/projects', { signal }),
    get: (id, signal) => request(`/admin/projects/${id}`, { signal }),
    create: (project) => request('/admin/projects', { method: 'POST', body: project }),
    update: (id, patch) => request(`/admin/projects/${id}`, { method: 'PATCH', body: patch }),
    remove: (id) => request(`/admin/projects/${id}`, { method: 'DELETE' }),
    setStatus: (id, status) =>
      request(`/admin/projects/${id}/status`, { method: 'POST', body: { status } }),
    setFeatured: (id, featured) =>
      request(`/admin/projects/${id}/feature`, { method: 'POST', body: { featured } }),
    reorder: (ids) => request('/admin/projects/reorder', { method: 'POST', body: { ids } }),

    uploadImage: (file) => {
      const form = new FormData();
      form.append('image', file);
      return request('/admin/uploads/image', { method: 'POST', body: form });
    },
    uploadGallery: (files) => {
      const form = new FormData();
      for (const file of files) form.append('images', file);
      return request('/admin/uploads/gallery', { method: 'POST', body: form });
    },
    uploadResume: (file) => {
      const form = new FormData();
      form.append('resume', file);
      return request('/admin/uploads/resume', { method: 'POST', body: form });
    },
    clearResume: () => request('/admin/uploads/resume', { method: 'DELETE' }),
  },
};

export default api;