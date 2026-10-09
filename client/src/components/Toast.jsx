import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Lightweight notification system used for every success / failure message in
 * the Project Manager.
 */

const ToastContext = createContext(null);

const ICONS = { success: '✓', error: '!', info: 'i' };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) =>
      current.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast)),
    );
    const timer = setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
      timers.current.delete(id);
    }, 240);
    timers.current.set(`leave-${id}`, timer);
  }, []);

  const push = useCallback(
    (type, title, detail) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((current) => [...current.slice(-3), { id, type, title, detail }]);
      const timer = setTimeout(() => dismiss(id), type === 'error' ? 7000 : 4200);
      timers.current.set(id, timer);
      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    const store = timers.current;
    return () => {
      for (const timer of store.values()) clearTimeout(timer);
      store.clear();
    };
  }, []);

  const value = useMemo(
    () => ({
      success: (title, detail) => push('success', title, detail),
      error: (title, detail) => push('error', title, detail),
      info: (title, detail) => push('info', title, detail),
      /** Turns a thrown API error into a readable notification. */
      fromError: (error, fallback = 'Something went wrong.') =>
        push('error', error?.message ?? fallback, describeFields(error?.fields)),
      dismiss,
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span className="toast-icon" aria-hidden="true">
              {ICONS[toast.type]}
            </span>
            <div className="toast-body">
              <div className="toast-title">{toast.title}</div>
              {toast.detail ? <div className="toast-detail">{toast.detail}</div> : null}
            </div>
            <button
              type="button"
              className="toast-close"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function describeFields(fields) {
  const entries = Object.entries(fields ?? {});
  if (entries.length === 0) return undefined;
  return entries
    .map(([key, message]) => `${key}: ${message}`)
    .slice(0, 3)
    .join(' · ');
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
}

export default ToastProvider;