import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import CommandPalette from './CommandPalette';
import Icon from './icons';
import Logo from './Logo';
import ShortcutsModal from './ShortcutsModal';
import { Avatar } from './ui';

const NAV = [
  { to: '/', label: 'Tổng quan', icon: 'dashboard', end: true },
  { to: '/board', label: 'Bảng Kanban', icon: 'kanban', end: false },
  { to: '/tasks', label: 'Công việc', icon: 'tasks', end: false },
  { to: '/projects', label: 'Dự án', icon: 'folder', end: false },
];

const THEMES = [
  { value: 'light', icon: 'sun', label: 'Giao diện sáng' },
  { value: 'dark', icon: 'moon', label: 'Giao diện tối' },
  { value: 'system', icon: 'monitor', label: 'Theo hệ thống' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Phím tắt toàn cục
  useEffect(() => {
    const onKey = (e) => {
      const el = document.activeElement;
      const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette((v) => !v);
        return;
      }

      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        navigate('/tasks?new=1');
      } else if (e.key === '/') {
        const search = document.querySelector('.search-wrap input');
        e.preventDefault();
        if (search) search.focus();
        else setPalette(true);
      } else if (e.key === '?') {
        e.preventDefault();
        setShortcutsOpen(true);
      }
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [navigate]);

  const signOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app">
      <aside className={`sidebar${open ? ' sidebar--open' : ''}`}>
        <div className="brand">
          <Logo size={36} className="logo" />
          <div className="brand__text">
            <strong>WorkQueue</strong>
            <small>Quản lý công việc</small>
          </div>
        </div>

        <button
          type="button"
          className="sidebar-search"
          onClick={() => setPalette(true)}
          title="Tìm kiếm hoặc chạy lệnh (⌘K)"
        >
          <Icon name="search" size={15} />
          <span>Tìm kiếm nhanh...</span>
          <kbd>{navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'} K</kbd>
        </button>

        <nav className="nav">
          <span className="nav__label">Không gian làm việc</span>

          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav__item${isActive ? ' nav__item--active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <span className="nav__icon-box">
                <Icon name={item.icon} className="nav__icon" />
              </span>
              <span className="nav__text">{item.label}</span>
            </NavLink>
          ))}

          <span className="nav__label">Cài đặt cá nhân</span>

          <NavLink
            to="/settings"
            className={({ isActive }) => `nav__item${isActive ? ' nav__item--active' : ''}`}
            onClick={() => setOpen(false)}
          >
            <span className="nav__icon-box">
              <Icon name="user" className="nav__icon" />
            </span>
            <span className="nav__text">Tài khoản</span>
          </NavLink>

          <button
            type="button"
            className="nav__item nav__item--btn"
            onClick={() => setShortcutsOpen(true)}
          >
            <span className="nav__icon-box">
              <Icon name="keyboard" className="nav__icon" />
            </span>
            <span className="nav__text">Phím tắt</span>
            <kbd className="nav__kbd">?</kbd>
          </button>
        </nav>

        <div className="sidebar__foot">
          <div className="theme-switch" role="group" aria-label="Chế độ hiển thị">
            {THEMES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTheme(t.value)}
                aria-pressed={theme === t.value}
                title={t.label}
              >
                <Icon name={t.icon} size={15} />
              </button>
            ))}
          </div>

          <div className="user-chip">
            <Avatar user={user} size={34} showStatus isOnline />
            <div className="user-chip__info">
              <strong>{user?.name}</strong>
              <small>{user?.email}</small>
            </div>
            <button
              type="button"
              className="icon-btn icon-btn--logout"
              onClick={signOut}
              title="Đăng xuất"
              aria-label="Đăng xuất"
            >
              <Icon name="logout" size={16} />
            </button>
          </div>
        </div>
      </aside>

      {open && <div className="backdrop" onClick={() => setOpen(false)} />}

      <div className="main">
        {/* Mobile / Responsive Header Bar */}
        <div className="mobile-topbar">
          <button
            type="button"
            className="icon-btn menu-btn"
            onClick={() => setOpen((v) => !v)}
            aria-label="Mở menu"
          >
            <Icon name="menu" />
          </button>

          <div className="mobile-brand">
            <Logo size={28} />
            <span>WorkQueue</span>
          </div>

          <button
            type="button"
            className="icon-btn"
            onClick={() => setPalette(true)}
            aria-label="Tìm kiếm"
          >
            <Icon name="search" size={17} />
          </button>
        </div>

        <Outlet />
      </div>

      <CommandPalette open={palette} onClose={() => setPalette(false)} />
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}
