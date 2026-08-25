import { useEffect } from 'react';
import { priorityMeta, statusMeta } from '../constants';

export function Avatar({ user, size = 32, title }) {
  if (!user) {
    return (
      <span className="avatar avatar--empty" style={{ width: size, height: size, fontSize: size * 0.45 }} title="Chưa giao">
        ?
      </span>
    );
  }
  const initials = user.name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <span
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.4, background: user.avatarColor || '#6366f1' }}
      title={title || `${user.name} · ${user.email}`}
    >
      {initials}
    </span>
  );
}

export function StatusBadge({ status }) {
  const meta = statusMeta(status);
  return (
    <span className="badge" style={{ color: meta.color, background: `${meta.color}1a` }}>
      <i className="dot" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const meta = priorityMeta(priority);
  return (
    <span className="badge" style={{ color: meta.color, background: `${meta.color}1a` }}>
      {meta.label}
    </span>
  );
}

export function Spinner({ label = 'Đang tải...' }) {
  return (
    <div className="loading">
      <span className="spinner" /> {label}
    </div>
  );
}

export function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div className="empty">
      <div className="empty__icon">{icon}</div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function Modal({ open, onClose, title, children, width = 560 }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: width }} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal__head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </header>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Xoá', onConfirm, onCancel }) {
  return (
    <Modal open={open} onClose={onCancel} title={title} width={420}>
      <p className="muted" style={{ marginBottom: 20 }}>{message}</p>
      <div className="row-end">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Huỷ</button>
        <button type="button" className="btn btn--danger" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}
