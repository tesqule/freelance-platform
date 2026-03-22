import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((msg, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const ICONS = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Toast container */}
      <div style={{
        position: 'fixed', bottom: '1.5rem', right: '1.5rem',
        zIndex: 9999, display: 'flex', flexDirection: 'column',
        gap: '.5rem', pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id}
            onClick={() => remove(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '.65rem',
              background: 'var(--card2)', border: '1px solid var(--border2)',
              borderRadius: 12, padding: '.8rem 1.1rem',
              fontSize: '.875rem', fontWeight: 500,
              minWidth: 240, maxWidth: 340,
              boxShadow: '0 8px 32px rgba(0,0,0,.5)',
              cursor: 'pointer', pointerEvents: 'all',
              animation: 'toastIn .3s cubic-bezier(.34,1.56,.64,1)',
              borderLeft: `3px solid ${
                t.type === 'success' ? 'var(--green)'
                : t.type === 'error' ? 'var(--red)'
                : t.type === 'warning' ? 'var(--amber)'
                : 'var(--blue)'
              }`,
              color: 'var(--text)',
            }}>
            <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{ICONS[t.type]}</span>
            <span style={{ flex: 1, lineHeight: 1.45 }}>{t.msg}</span>
            <span style={{ color: 'var(--text3)', fontSize: '.75rem', flexShrink: 0 }}>✕</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
