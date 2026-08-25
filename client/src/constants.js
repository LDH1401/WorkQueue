export const STATUSES = [
  { value: 'todo', label: 'Cần làm', color: '#64748b' },
  { value: 'in_progress', label: 'Đang làm', color: '#3b82f6' },
  { value: 'done', label: 'Hoàn thành', color: '#10b981' },
];

export const PRIORITIES = [
  { value: 'low', label: 'Thấp', color: '#94a3b8' },
  { value: 'medium', label: 'Trung bình', color: '#0ea5e9' },
  { value: 'high', label: 'Cao', color: '#f59e0b' },
  { value: 'urgent', label: 'Khẩn cấp', color: '#ef4444' },
];

export const PROJECT_COLORS = ['#10b981', '#0ea5e9', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6', '#6366f1'];

export const statusMeta = (value) => STATUSES.find((s) => s.value === value) || STATUSES[0];
export const priorityMeta = (value) => PRIORITIES.find((p) => p.value === value) || PRIORITIES[1];
