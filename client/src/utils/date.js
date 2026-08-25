const fmtDate = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

const pad = (n) => String(n).padStart(2, '0');

/**
 * Quy ước hạn chót:
 * - Có giờ cụ thể  -> lưu đúng mốc thời gian đó.
 * - Không nhập giờ -> lưu 23:59 cùng ngày, hiểu là "hạn cuối ngày".
 *   Nhờ vậy việc chỉ đặt hạn theo ngày không bị báo quá hạn ngay từ sáng,
 *   và mọi so sánh "dueDate < bây giờ" ở cả client lẫn server đều đúng.
 */
const END_HOUR = 23;
const END_MINUTE = 59;

export const isEndOfDay = (value) => {
  const d = new Date(value);
  return d.getHours() === END_HOUR && d.getMinutes() === END_MINUTE;
};

/** Có giờ cụ thể do người dùng đặt hay không */
export const hasTime = (value) => Boolean(value) && !isEndOfDay(value);

export const formatDate = (value) => (value ? fmtDate.format(new Date(value)) : '—');
export const formatTime = (value) => {
  const d = new Date(value);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export const formatDateTime = (value) =>
  value ? `${fmtDate.format(new Date(value))} ${formatTime(value)}` : '—';

/** Hiển thị hạn chót đầy đủ: có giờ thì kèm giờ, không thì chỉ ngày */
export const formatDue = (value) =>
  !value ? '—' : hasTime(value) ? formatDateTime(value) : formatDate(value);

/** Tách ISO thành { date: 'YYYY-MM-DD', time: 'HH:mm' } theo giờ máy người dùng */
export function splitDue(value) {
  if (!value) return { date: '', time: '' };
  const d = new Date(value);
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: isEndOfDay(value) ? '' : `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

/** Ghép ngày + giờ từ form thành ISO string (giờ trống = cuối ngày) */
export function joinDue(date, time) {
  if (!date) return null;
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time ? time.split(':').map(Number) : [END_HOUR, END_MINUTE];
  return new Date(y, m - 1, d, hh, mm, 0, 0).toISOString();
}

/** Nhãn hạn chót thân thiện: Hôm nay 15:30 / Quá hạn 2 giờ / Còn 3 ngày ... */
export function dueLabel(value, status) {
  if (!value) return null;

  // Việc đã hoàn thành thì chỉ hiển thị mốc, không cảnh báo trễ hạn nữa
  if (status === 'done') return { text: formatDue(value), tone: 'normal' };

  const due = new Date(value);
  const now = new Date();
  const clock = hasTime(value) ? ` ${formatTime(value)}` : '';

  if (due < now) {
    const mins = Math.round((now - due) / 60000);
    if (mins < 60) return { text: `Quá hạn ${mins} phút`, tone: 'danger' };
    if (mins < 1440) return { text: `Quá hạn ${Math.round(mins / 60)} giờ`, tone: 'danger' };
    return { text: `Quá hạn ${Math.round(mins / 1440)} ngày`, tone: 'danger' };
  }

  const startToday = new Date(now).setHours(0, 0, 0, 0);
  const days = Math.round((new Date(due).setHours(0, 0, 0, 0) - startToday) / 864e5);

  if (days === 0) return { text: `Hôm nay${clock}`, tone: 'warn' };
  if (days === 1) return { text: `Ngày mai${clock}`, tone: 'warn' };
  if (days <= 7) return { text: `Còn ${days} ngày${clock}`, tone: 'normal' };
  return { text: `${pad(due.getDate())}/${pad(due.getMonth() + 1)}${clock}`, tone: 'normal' };
}

export function relativeTime(value) {
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const dayCount = Math.round(hours / 24);
  if (dayCount < 30) return `${dayCount} ngày trước`;
  return formatDate(value);
}
