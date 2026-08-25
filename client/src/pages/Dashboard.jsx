import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Icon from '../components/icons';
import StreakBanner from '../components/StreakBanner';
import TaskDialog from '../components/TaskDialog';
import { DashboardSkeleton, EmptyState, PriorityBadge, ProgressRing, StatusBadge, useCountUp } from '../components/ui';
import { STATUSES } from '../constants';
import { useAuth } from '../context/AuthContext';
import useWorkspace from '../hooks/useWorkspace';
import { dueLabel } from '../utils/date';
import { computeStreak } from '../utils/streak';

function StatCard({ icon, label, value, hint, pill, tone = '' }) {
  const shown = useCountUp(value);

  return (
    <article className={`stat ${tone}`}>
      <div className="stat__top">
        <span className="stat__icon">
          <Icon name={icon} />
        </span>
        {pill}
      </div>
      <span className="stat__value">{shown}</span>
      <span className="stat__label">{label}</span>
      {hint && <span className="stat__hint">{hint}</span>}
    </article>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { projects } = useWorkspace();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState(null);

  const load = () => {
    api
      .get('/tasks/stats')
      .then(({ data }) => setStats(data.stats))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const streak = computeStreak(stats?.deadlines);


  const hour = new Date().getHours();
  const greeting =
    hour < 11 ? 'Chào buổi sáng' : hour < 14 ? 'Chào buổi trưa' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
  const firstName = user?.name?.trim().split(/\s+/).slice(-1)[0];

  return (
    <>
      <header className="page-head">
        <div>
          <h1>
            {greeting}, {firstName} 👋
          </h1>
          <p>Đây là tình hình công việc của bạn hôm nay.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setDialog({})}>
          <Icon name="plus" />
          Công việc mới
        </button>
      </header>

      {error && (
        <div className="alert alert--error">
          <Icon name="alert" />
          {error}
        </div>
      )}

      {loading ? (
        <DashboardSkeleton />
      ) : (
        stats && (
          <>
            <StreakBanner streak={streak} />

            <section className="stat-grid">
              <StatCard
                icon="clipboard"
                label="Tổng công việc"
                value={stats.total}
                hint={`${stats.status.done} việc đã xong`}
                tone="stat--accent"
              />
              <StatCard
                icon="target"
                label="Đang làm dở"
                value={stats.inProgress}
                hint="đang dở dang"
              />
              <StatCard
                icon="clock"
                label="Quá hạn"
                value={stats.overdue}
                tone={stats.overdue ? 'stat--danger' : ''}
                hint={`${stats.dueToday} việc đến hạn hôm nay`}
                pill={
                  stats.overdue > 0 ? (
                    <span className="pill pill--danger">Cần xử lý</span>
                  ) : (
                    <span className="pill pill--success">Đúng hạn</span>
                  )
                }
              />
              <StatCard
                icon="sparkles"
                label="Hoàn thành 7 ngày qua"
                value={stats.completedThisWeek}
                tone="stat--success"
                hint="so với tổng số việc đã giao"
              />
            </section>

            <div className="two-col two-col--stretch">
              <section className="card">
                <div className="card__head">
                  <h2>Tiến độ tổng thể</h2>
                  <Link to="/board" className="link">
                    Xem bảng <Icon name="arrowRight" width={13} height={13} />
                  </Link>
                </div>

                <div className="ring-wrap">
                  <ProgressRing value={stats.completionRate} />

                  <ul className="legend">
                    {STATUSES.map((s) => {
                      const count = stats.status[s.value];
                      const percent = stats.total ? (count / stats.total) * 100 : 0;
                      return (
                        <li key={s.value}>
                          <i className="dot" style={{ background: s.color }} />
                          {s.label}
                          <span className="legend__bar">
                            <span style={{ width: `${percent}%`, background: s.color }} />
                          </span>
                          <strong>{count}</strong>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </section>

              <section className="card">
                <div className="card__head">
                  <h2>Sắp đến hạn</h2>
                  <Link to="/tasks?due=week" className="link">
                    Tất cả <Icon name="arrowRight" width={13} height={13} />
                  </Link>
                </div>

                {stats.upcoming.length === 0 ? (
                  <EmptyState
                    icon="sparkles"
                    title="Không có deadline nào sắp tới"
                    description="Bạn đang kiểm soát tốt mọi việc."
                  />
                ) : (
                  <ul className="upcoming">
                    {stats.upcoming.map((task) => {
                      const due = dueLabel(task.dueDate, task.status);
                      return (
                        <li key={task._id}>
                          <button type="button" className="upcoming__item" onClick={() => setDialog(task)}>
                            <PriorityBadge priority={task.priority} showLabel={false} />
                            <div className="upcoming__info">
                              <strong>{task.title}</strong>
                              <div className="upcoming__meta">
                                <span className="muted-sm">{task.project?.name || 'Không thuộc dự án'}</span>
                                <span className={`due due--${due.tone}`}>
                                  <Icon name="calendar" />
                                  {due.text}
                                </span>
                              </div>
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
                <Link to="/projects" className="link">
                  Quản lý <Icon name="arrowRight" width={13} height={13} />
                </Link>
              </div>

              {projects.length === 0 ? (
                <EmptyState
                  icon="folder"
                  title="Chưa có dự án nào"
                  description="Tạo dự án để nhóm các công việc liên quan lại với nhau."
                />
              ) : (
                <div className="project-mini-grid">
                  {projects.slice(0, 4).map((p) => {
                    const percent = p.stats.total ? Math.round((p.stats.done / p.stats.total) * 100) : 0;
                    return (
                      <Link key={p._id} to={`/board?project=${p._id}`} className="project-mini">
                        <span className="project-mini__dot" style={{ background: p.color }} />
                        <strong>{p.name}</strong>
                        <span className="muted-sm">
                          {p.stats.done}/{p.stats.total} công việc
                        </span>
                        <div className="progress-thin">
                          <span style={{ width: `${percent}%`, background: p.color }} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )
      )}

      <TaskDialog
        open={Boolean(dialog)}
        task={dialog?._id ? dialog : null}
        projects={projects}
        onClose={() => setDialog(null)}
        onSaved={load}
        onDeleted={load}
      />
    </>
  );
}
