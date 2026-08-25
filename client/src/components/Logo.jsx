import { useId } from 'react';

/**
 * Logo WorkQueue: vòng tròn hở đuôi tạo hình chữ Q (Queue) ôm lấy dấu tích (việc xong).
 *
 * variant='gradient' — huy hiệu gradient, dùng trên nền sáng/tối thường.
 * variant='glass'    — huy hiệu kính mờ, dùng khi đặt trên nền gradient.
 */
export default function Logo({ size = 36, variant = 'gradient', className }) {
  const uid = useId().replace(/:/g, '');
  const gradId = `wq-badge-${uid}`;
  const glass = variant === 'glass';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      role="img"
      aria-label="WorkQueue"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="52%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#d946ef" />
        </linearGradient>
      </defs>

      <rect
        width="32"
        height="32"
        rx="9.5"
        fill={glass ? 'rgba(255,255,255,0.18)' : `url(#${gradId})`}
        stroke={glass ? 'rgba(255,255,255,0.28)' : 'none'}
      />

      {/* Vòng Q */}
      <circle cx="14.8" cy="14.8" r="8.2" fill="none" stroke="#fff" strokeWidth="2.4" opacity="0.5" />
      <path d="M20.6 20.6 24.6 24.6" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" opacity="0.5" />

      {/* Dấu tích */}
      <path
        d="M11.2 15 14 17.8 19.2 12"
        fill="none"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
