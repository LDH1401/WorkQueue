const fmt = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
const fmtTime = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export const formatDate = (value) => (value ? fmt.format(new Date(value)) : '—');
export const formatDateTime = (value) => (value ? fmtTime.format(new Date(value)) : '—');

/** Chuyển ISO string sang giá trị cho <input type="date"> */
export const toInputDate = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

/** Nhãn hạn chót thân thiện: Hôm nay / Ngày mai / Quá hạn 3 ngày ... */
export function dueLabel(value, status) {
  if (!value) return null;
  // Việc đã hoàn thành thì chỉ hiển thị ngày, không cảnh báo trễ hạn nữa
  if (status === 'done') return { text: formatDate(value), tone: 'normal' };
  const today = new Date().setHours(0, 0, 0, 0);
  const due = new Date(value).setHours(0, 0, 0, 0);
  const diff = Math.round((due - today) / 864e5);

  if (diff === 0) return { text: 'Hôm nay', tone: 'warn' };
  if (diff === 1) return { text: 'Ngày mai', tone: 'warn' };
  if (diff < 0) return { text: `Quá hạn ${Math.abs(diff)} ngày`, tone: 'danger' };
  if (diff <= 7) return { text: `Còn ${diff} ngày`, tone: 'normal' };
  return { text: formatDate(value), tone: 'normal' };
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
