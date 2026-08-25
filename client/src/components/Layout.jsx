import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './ui';

const NAV = [
  { to: '/', label: 'Tổng quan', icon: '📊', end: true },
  { to: '/board', label: 'Bảng Kanban', icon: '🗂', end: false },
  { to: '/tasks', label: 'Danh sách công việc', icon: '✅', end: false },
  { to: '/projects', label: 'Dự án', icon: '📁', end: false },
  { to: '/settings', label: 'Tài khoản', icon: '⚙️', end: false },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const signOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app">
      <aside className={`sidebar${open ? ' sidebar--open' : ''}`}>
        <div className="brand">
          <span className="brand__logo">WQ</span>
          <div>
            <strong>WorkQueue</strong>
            <small>Quản lý công việc</small>
          </div>
        </div>

        <nav className="nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav__item${isActive ? ' nav__item--active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__foot">
          <div className="user-chip">
            <Avatar user={user} size={36} />
            <div className="user-chip__info">
              <strong>{user?.name}</strong>
              <small>{user?.email}</small>
            </div>
          </div>
          <button type="button" className="btn btn--ghost btn--block" onClick={signOut}>
            Đăng xuất
          </button>
        </div>
      </aside>

      {open && <div className="backdrop" onClick={() => setOpen(false)} />}

      <div className="main">
        <button type="button" className="icon-btn menu-btn" onClick={() => setOpen((v) => !v)} aria-label="Mở menu">
          ☰
        </button>
        <Outlet />
      </div>
    </div>
  );
}
