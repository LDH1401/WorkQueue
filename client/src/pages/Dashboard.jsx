import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import TaskDialog from '../components/TaskDialog';
import { Avatar, EmptyState, Spinner, StatusBadge } from '../components/ui';
import { STATUSES } from '../constants';
import { useAuth } from '../context/AuthContext';
import useWorkspace from '../hooks/useWorkspace';
import { dueLabel } from '../utils/date';

function StatCard({ icon, label, value, hint, tone = '' }) {
  return (
    <div className={`stat ${tone}`}>
      <span className="stat__icon">{icon}</span>
      <div>
        <span className="stat__value">{value}</span>
        <span className="stat__label">{label}</span>
        {hint && <span className="stat__hint">{hint}</span>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { projects, users } = useWorkspace();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .get('/tasks/stats')
      .then(({ data }) => setStats(data.stats))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <Spinner />;
  if (error) return <div className="alert alert--error">{error}</div>;

  const hour = new Date().getHours();
  const greeting = hour < 11 ? 'Chào buổi sáng' : hour < 14 ? 'Chào buổi trưa' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  return (
    <>
      <header className="page-head">
        <div>
          <h1>{greeting}, {user?.name?.split(' ').slice(-1)[0]} 👋</h1>
          <p className="muted">Đây là tình hình công việc của bạn hôm nay.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setDialog({})}>
          + Công việc mới
        </button>
      </header>

      <section className="stat-grid">
        <StatCard icon="📋" label="Tổng công việc" value={stats.total} hint={`${stats.status.done} đã hoàn thành`} />
        <StatCard icon="🎯" label="Được giao cho bạn" value={stats.assignedToMe} hint="đang chờ xử lý" />
        <StatCard icon="⏰" label="Quá hạn" value={stats.overdue} tone={stats.overdue ? 'stat--danger' : ''} hint={`${stats.dueToday} đến hạn hôm nay`} />
        <StatCard icon="✨" label="Hoàn thành 7 ngày qua" value={stats.completedThisWeek} hint={`Tỉ lệ hoàn thành ${stats.completionRate}%`} />
      </section>

      <div className="two-col">
        <section className="card">
          <div className="card__head">
            <h2>Phân bố theo trạng thái</h2>
            <Link to="/board" className="link">Xem bảng →</Link>
          </div>

          <div className="progress-bar" title={`${stats.completionRate}% hoàn thành`}>
            {STATUSES.map((s) =>
              stats.status[s.value] ? (
                <span
                  key={s.value}
                  style={{ width: `${(stats.status[s.value] / stats.total) * 100}%`, background: s.color }}
                  title={`${s.label}: ${stats.status[s.value]}`}
                />
              ) : null
            )}
            {stats.total === 0 && <span style={{ width: '100%', background: '#e2e8f0' }} />}
          </div>

          <ul className="legend">
            {STATUSES.map((s) => (
              <li key={s.value}>
                <i className="dot" style={{ background: s.color }} />
                {s.label}
                <strong>{stats.status[s.value]}</strong>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <div className="card__head">
            <h2>Sắp đến hạn</h2>
            <Link to="/tasks?due=week" className="link">Tất cả →</Link>
          </div>

          {stats.upcoming.length === 0 ? (
            <EmptyState icon="🎉" title="Không có deadline nào sắp tới" description="Bạn đang kiểm soát tốt mọi việc." />
          ) : (
            <ul className="upcoming">
              {stats.upcoming.map((task) => {
                const due = dueLabel(task.dueDate, task.status);
                return (
                  <li key={task._id}>
                    <button type="button" className="upcoming__item" onClick={() => setDialog(task)}>
                      <Avatar user={task.assignee} size={30} />
                      <div className="upcoming__info">
                        <strong>{task.title}</strong>
                        <span className="muted-sm">
                          {task.project?.name || 'Không thuộc dự án'} · <span className={`due due--${due.tone}`}>{due.text}</span>
                        </span>
                      </div>
                      <StatusBadge status={task.status} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="card">
        <div className="card__head">
          <h2>Dự án của bạn</h2>
          <Link to="/projects" className="link">Quản lý →</Link>
        </div>

        {projects.length === 0 ? (
          <EmptyState icon="📁" title="Chưa có dự án nào" description="Tạo dự án để nhóm các công việc liên quan lại với nhau." />
        ) : (
          <div className="project-mini-grid">
            {projects.slice(0, 4).map((p) => {
              const percent = p.stats.total ? Math.round((p.stats.done / p.stats.total) * 100) : 0;
              return (
                <Link key={p._id} to={`/board?project=${p._id}`} className="project-mini">
                  <span className="project-mini__dot" style={{ background: p.color }} />
                  <strong>{p.name}</strong>
                  <span className="muted-sm">{p.stats.done}/{p.stats.total} công việc</span>
                  <div className="progress-thin">
                    <span style={{ width: `${percent}%`, background: p.color }} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <TaskDialog
        open={Boolean(dialog)}
        task={dialog?._id ? dialog : null}
        projects={projects}
        users={users}
        onClose={() => setDialog(null)}
        onSaved={load}
        onDeleted={load}
      />
    </>
  );
}
