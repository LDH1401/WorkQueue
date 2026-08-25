import { createContext, useCallback, useContext, useState } from 'react';
import Icon from '../components/icons';

const ToastContext = createContext(null);
const ICONS = { success: 'check', error: 'alert', info: 'info' };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (message, type = 'success', action = null) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type, action }]);
      // Thông báo có nút hành động thì để lâu hơn cho kịp bấm
      setTimeout(() => dismiss(id), action ? 7000 : 3500);
    },
    [dismiss]
  );

  const toast = {
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error'),
    info: (m) => push(m, 'info'),
    /** Thông báo kèm nút Hoàn tác */
    undo: (m, onUndo) => push(m, 'success', { label: 'Hoàn tác', run: onUndo }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.type}`}>
            <span className="toast__icon">
              <Icon name={ICONS[t.type]} />
            </span>
            <span className="toast__msg">{t.message}</span>
            {t.action && (
              <button
                type="button"
                className="toast__action"
                onClick={() => {
                  dismiss(t.id);
                  t.action.run?.();
                }}
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast phải được dùng bên trong <ToastProvider>');
  return ctx;
};
