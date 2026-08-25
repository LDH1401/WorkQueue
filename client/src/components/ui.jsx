import { useEffect, useId, useRef, useState } from 'react';
import { priorityMeta, statusMeta } from '../constants';
import Icon from './icons';

const prefersReducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Đếm số từ 0 lên giá trị thật, dùng cho các ô thống kê */
export function useCountUp(value, duration = 650) {
  // Bắt đầu từ 0 để lần hiển thị đầu tiên có hiệu ứng đếm lên
  const [display, setDisplay] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion()) return setDisplay(value);

    const start = performance.now();
    const begin = from.current;
    let raf;

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3; // ease-out cubic
      setDisplay(Math.round(begin + (value - begin) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return display;
}

/** Trộn màu với trắng để lấy tông sáng hơn cho điểm đầu gradient */
function lighten(hex, amount = 0.34) {
  const n = parseInt(hex.replace('#', ''), 16);
  if (Number.isNaN(n)) return hex;
  const mix = (c) => Math.round(c + (255 - c) * amount);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(mix);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/* ------------------------------ Ảnh đại diện ----------------------------- */
export function Avatar({ user, size = 32, title }) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38) };

  if (!user) {
    return (
      <span className="avatar avatar--empty" style={style} title="Chưa giao">
        <Icon name="user" width={size * 0.5} height={size * 0.5} />
      </span>
    );
  }

  const color = user.avatarColor || '#12864b';
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
      style={{
        ...style,
        background: `linear-gradient(140deg, ${lighten(color)} 0%, ${color} 100%)`,
      }}
      title={title || `${user.name} · ${user.email}`}
    >
      {initials}
    </span>
  );
}

/* --------------------------------- Nhãn ---------------------------------- */
export function StatusBadge({ status }) {
  const meta = statusMeta(status);
  return (
    <span className="badge" style={{ color: meta.color, background: `${meta.color}1f` }}>
      <i className="dot" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}

/** Mức ưu tiên hiển thị bằng 3 vạch cao dần — quét mắt nhanh hơn chữ */
export function PriorityBadge({ priority, showLabel = true }) {
  const meta = priorityMeta(priority);
  const level = { low: 1, medium: 2, high: 3, urgent: 3 }[priority] || 2;

  return (
    <span className="prio" style={{ color: meta.color }} title={`Ưu tiên: ${meta.label}`}>
      <span className="prio__bars">
        {[1, 2, 3].map((i) => (
          <i key={i} className={i <= level ? 'on' : ''} />
        ))}
      </span>
      {showLabel && meta.label}
    </span>
  );
}

/* ---------------------------- Vòng tiến độ SVG --------------------------- */
export function ProgressRing({ value = 0, size = 132, stroke = 11, label = 'hoàn thành' }) {
  const gradId = `wq-ring-${useId().replace(/:/g, '')}`;
  const [shown, setShown] = useState(prefersReducedMotion() ? value : 0);
  const r = (size - stroke) / 2;

  // Vẽ vòng từ 0 lên giá trị thật ngay sau khi gắn vào DOM
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
            <stop offset="55%" stopColor="#10b981" />
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
        <strong>{value}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

/* ------------------------------ Đang tải --------------------------------- */
export function Spinner({ label = 'Đang tải...' }) {
  return (
    <div className="loading">
      <span className="spinner" /> {label}
    </div>
  );
}

export function Skeleton({ className = '', style }) {
  return <div className={`skeleton ${className}`} style={style} />;
}

/** Khung xương cho trang tổng quan — giữ bố cục ổn định khi đang tải */
export function DashboardSkeleton() {
  return (
    <>
      <div className="skeleton-grid">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="skeleton-card" />
        ))}
      </div>
      <div className="two-col">
        <Skeleton style={{ height: 260, borderRadius: 'var(--r-lg)' }} />
        <Skeleton style={{ height: 260, borderRadius: 'var(--r-lg)' }} />
      </div>
    </>
  );
}

export function ListSkeleton({ rows = 6 }) {
  return (
    <div>
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
      {action}
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
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Đóng">
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
    <Modal open={open} onClose={onCancel} title={title} width={430}>
      <p className="muted" style={{ marginBottom: 22 }}>
        {message}
      </p>
      <div className="row-end">
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
