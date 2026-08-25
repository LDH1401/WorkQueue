import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { statusMeta } from '../constants';
import { useTheme } from '../context/ThemeContext';
import Icon from './icons';

const PAGES = [
  { id: 'p-home', icon: 'dashboard', label: 'Tổng quan', to: '/' },
  { id: 'p-board', icon: 'kanban', label: 'Bảng Kanban', to: '/board' },
  { id: 'p-tasks', icon: 'tasks', label: 'Danh sách công việc', to: '/tasks' },
  { id: 'p-projects', icon: 'folder', label: 'Quản lý dự án', to: '/projects' },
  { id: 'p-settings', icon: 'user', label: 'Cài đặt tài khoản', to: '/settings' },
];

const norm = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');

export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [tasks, setTasks] = useState([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const timer = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const q = query.trim();
    if (!q) {
      setTasks([]);
      return undefined;
    }

    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const { data } = await api.get('/tasks', { params: { q, limit: 6 } });
        setTasks(data.items);
      } catch {
        setTasks([]);
      }
    }, 200);

    return () => clearTimeout(timer.current);
  }, [query, open]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTasks([]);
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  const actions = useMemo(
    () => [
      { id: 'a-new', icon: 'plus', label: 'Tạo công việc mới', hint: 'N', run: () => navigate('/tasks?new=1') },
      { id: 'a-project', icon: 'folder', label: 'Tạo dự án mới', run: () => navigate('/projects?new=1') },
      { id: 'a-overdue', icon: 'clock', label: 'Xem các việc quá hạn', run: () => navigate('/tasks?due=overdue') },
      { id: 'a-today', icon: 'calendar', label: 'Xem việc đến hạn hôm nay', run: () => navigate('/tasks?due=today') },
      { id: 'a-light', icon: 'sun', label: 'Chuyển sang giao diện Sáng', run: () => setTheme('light') },
      { id: 'a-dark', icon: 'moon', label: 'Chuyển sang giao diện Tối', run: () => setTheme('dark') },
      { id: 'a-system', icon: 'monitor', label: 'Giao diện theo hệ điều hành', run: () => setTheme('system') },
    ],
    [navigate, setTheme]
  );

  const groups = useMemo(() => {
    const q = norm(query.trim());
    const match = (label) => !q || norm(label).includes(q);

    const result = [];
    const pages = PAGES.filter((p) => match(p.label));
    const acts = actions.filter((a) => match(a.label));

    if (tasks.length) {
      result.push({
        title: 'Công việc khớp tìm kiếm',
        items: tasks.map((t) => ({
          id: t._id,
          icon: 'tasks',
          label: t.title,
          meta: statusMeta(t.status).label,
          color: statusMeta(t.status).color,
          run: () => navigate(`/tasks?task=${t._id}`),
        })),
      });
    }
    if (pages.length) result.push({ title: 'Điều hướng trang', items: pages.map((p) => ({ ...p, run: () => navigate(p.to) })) });
    if (acts.length) result.push({ title: 'Thao tác nhanh', items: acts });

    return result;
  }, [query, tasks, actions, navigate]);

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  useEffect(() => {
    setActive((i) => Math.min(i, Math.max(0, flat.length - 1)));
  }, [flat.length]);

  const select = useCallback(
    (item) => {
      onClose();
      item?.run?.();
    },
    [onClose]
  );

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % Math.max(1, flat.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i - 1 + flat.length) % Math.max(1, flat.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flat[active]) select(flat[active]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  let index = -1;

  return (
    <div className="overlay overlay--top" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Bảng lệnh">
        <div className="palette__input">
          <Icon name="search" className="palette__search-icon" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Tìm kiếm công việc, chuyển trang, đổi giao diện..."
            aria-label="Tìm kiếm"
          />
          {query && (
            <button type="button" className="palette__clear" onClick={() => setQuery('')} aria-label="Xóa">
              <Icon name="x" size={14} />
            </button>
          )}
          <kbd className="palette__kbd-esc">esc</kbd>
        </div>

        <div className="palette__list" ref={listRef}>
          {flat.length === 0 ? (
            <div className="palette__empty">
              <Icon name="search" size={24} />
              <p>Không tìm thấy kết quả phù hợp với "{query}".</p>
            </div>
          ) : (
            groups.map((group) => (
              <section key={group.title} className="palette__section">
                <h4>{group.title}</h4>
                {group.items.map((item) => {
                  index += 1;
                  const i = index;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="palette__item"
                      data-active={i === active}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => select(item)}
                    >
                      <span className="palette__item-icon">
                        <Icon name={item.icon} />
                      </span>
                      <span className="palette__label">{item.label}</span>
                      {item.meta && (
                        <span
                          className="badge badge--sm"
                          style={{
                            color: item.color,
                            background: `color-mix(in srgb, ${item.color} 14%, transparent)`,
                          }}
                        >
                          {item.meta}
                        </span>
                      )}
                      {item.hint && <kbd className="palette__item-hint">{item.hint}</kbd>}
                    </button>
                  );
                })}
              </section>
            ))
          )}
        </div>

        <footer className="palette__foot">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> Di chuyển
          </span>
          <span>
            <kbd>↵</kbd> Thực hiện
          </span>
          <span>
            <kbd>Esc</kbd> Đóng
          </span>
        </footer>
      </div>
    </div>
  );
}
