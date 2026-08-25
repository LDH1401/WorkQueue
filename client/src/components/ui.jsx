import { useEffect, useId, useRef, useState } from 'react';
import { priorityMeta, statusMeta } from '../constants';
import Icon from './icons';

const prefersReducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Đếm số từ 0 lên giá trị thật với easing tự nhiên */
export function useCountUp(value, duration = 600) {
  const [display, setDisplay] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion()) return setDisplay(value);

    const start = performance.now();
    const begin = from.current;
    let raf;

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setDisplay(Math.round(begin + (value - begin) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return display;
}

function lighten(hex, amount = 0.28) {
  const n = parseInt(hex.replace('#', ''), 16);
  if (Number.isNaN(n)) return hex;
  const mix = (c) => Math.round(c + (255 - c) * amount);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(mix);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/* ------------------------------ Ảnh đại diện ----------------------------- */
export function Avatar({ user, size = 32, title, showStatus = false, isOnline = true }) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38) };

  if (!user) {
    return (
      <span className="avatar avatar--empty" style={style} title="Chưa giao">
        <Icon name="user" width={size * 0.5} height={size * 0.5} />
      </span>
    );
  }

  const color = user.avatarColor || '#10b981';
  const initials = user.name
    ? user.name
        .trim()
        .split(/\s+/)
        .slice(-2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <div className="avatar-wrapper" style={{ width: size, height: size }}>
      <span
        className="avatar"
        style={{
          ...style,
          background: `linear-gradient(135deg, ${lighten(color)} 0%, ${color} 100%)`,
        }}
        title={title || `${user.name} · ${user.email}`}
      >
        {initials}
      </span>
      {showStatus && <span className={`avatar-status-dot ${isOnline ? 'online' : 'offline'}`} />}
    </div>
  );
}

/* --------------------------------- Nhãn ---------------------------------- */
export function StatusBadge({ status }) {
  const meta = statusMeta(status);
  return (
    <span
      className={`badge badge--status badge--${status}`}
      style={{
        color: meta.color,
        background: `color-mix(in srgb, ${meta.color} 14%, transparent)`,
        borderColor: `color-mix(in srgb, ${meta.color} 28%, transparent)`,
      }}
    >
      <i className="dot" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}

/** Mức ưu tiên hiển thị bằng 3 vạch cao dần */
export function PriorityBadge({ priority, showLabel = true }) {
  const meta = priorityMeta(priority);
  const level = { low: 1, medium: 2, high: 3, urgent: 3 }[priority] || 2;
  const isUrgent = priority === 'urgent';

  return (
    <span
      className={`prio ${isUrgent ? 'prio--urgent' : ''}`}
      style={{
        color: meta.color,
        background: `color-mix(in srgb, ${meta.color} 12%, transparent)`,
      }}
      title={`Ưu tiên: ${meta.label}`}
    >
      <span className="prio__bars">
        {[1, 2, 3].map((i) => (
          <i key={i} className={i <= level ? 'on' : ''} />
        ))}
      </span>
      {showLabel && <span className="prio__text">{meta.label}</span>}
      {isUrgent && <span className="prio__pulse" />}
    </span>
  );
}

/* ---------------------------- Vòng tiến độ SVG --------------------------- */
export function ProgressRing({ value = 0, size = 140, stroke = 12, label = 'hoàn thành' }) {
  const gradId = `wq-ring-${useId().replace(/:/g, '')}`;
  const [shown, setShown] = useState(prefersReducedMotion() ? value : 0);
  const r = (size - stroke) / 2;

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(id);
  }, [value]);

  const circumference = 2 * Math.PI * r;
  const offset = circumference - (Math.min(100, Math.max(0, shown)) / 100) * circumference;

  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
        <circle className="ring__track" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} />
        <circle
          className="ring__fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          stroke={`url(#${gradId})`}
        />
      </svg>
      <div className="ring__center">
        <strong>{shown}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

/* ------------------------------ Đang tải --------------------------------- */
export function Spinner({ label = 'Đang tải...', size = 18 }) {
  return (
    <div className="loading">
      <span className="spinner" style={{ width: size, height: size }} />
      {label && <span>{label}</span>}
    </div>
  );
}

export function Skeleton({ className = '', style }) {
  return <div className={`skeleton ${className}`} style={style} />;
}

/** Khung xương cho trang tổng quan */
export function DashboardSkeleton() {
  return (
    <div className="skeleton-fade-in">
      <div className="skeleton-grid">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="skeleton-card" />
        ))}
      </div>
      <div className="two-col">
        <Skeleton style={{ height: 280, borderRadius: 'var(--r-lg)' }} />
        <Skeleton style={{ height: 280, borderRadius: 'var(--r-lg)' }} />
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 6 }) {
  return (
    <div className="skeleton-fade-in">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="skeleton-row" />
      ))}
    </div>
  );
}

/* ----------------------------- Trạng thái rỗng --------------------------- */
export function EmptyState({ icon = 'inbox', title, description, action }) {
  return (
    <div className="empty">
      <div className="empty__icon">
        <Icon name={icon} />
      </div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && <div className="empty__action">{action}</div>}
    </div>
  );
}

/* -------------------------------- Modal ---------------------------------- */
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
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Đóng" title="Đóng (Esc)">
            <Icon name="x" />
          </button>
        </header>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Xoá', onConfirm, onCancel }) {
  return (
    <Modal open={open} onClose={onCancel} title={title} width={440}>
      <div className="confirm-dialog-content">
        <div className="confirm-dialog-icon">
          <Icon name="alert" />
        </div>
        <p className="muted">{message}</p>
      </div>
      <div className="row-end" style={{ marginTop: 22 }}>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Huỷ
        </button>
        <button type="button" className="btn btn--danger" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
