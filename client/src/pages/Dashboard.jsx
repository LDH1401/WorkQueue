import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Icon from '../components/icons';
import StreakBanner from '../components/StreakBanner';
import TaskDialog from '../components/TaskDialog';
import { DashboardSkeleton, EmptyState, PriorityBadge, ProgressRing, StatusBadge, useCountUp } from '../components/ui';
import { STATUSES } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useWorkspace from '../hooks/useWorkspace';
import { fireConfetti } from '../utils/confetti';
import { dueLabel } from '../utils/date';
import { computeStreak } from '../utils/streak';

function StatCard({ icon, label, value, hint, pill, tone = '' }) {
  const shown = useCountUp(value);

  return (
    <article className={`stat ${tone}`}>
      <div className="stat__top">
        <span className="stat__icon">
          <Icon name={icon} size={18} />
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
  const toast = useToast();
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

  const toggleTaskStatus = async (task, e) => {
    e?.stopPropagation();
    const nextStatus = task.status === 'done' ? 'todo' : 'done';
    try {
      await api.patch(`/tasks/${task._id}`, { status: nextStatus });
      if (nextStatus === 'done') {
        fireConfetti(0.6, 0.4);
        toast.success(`Đã hoàn thành "${task.title}"! 🎉`);
      } else {
        toast.info(`Đã chuyển "${task.title}" về cần làm`);
      }
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Lời chào kèm icon đổi theo buổi trong ngày
  const now = new Date();
  const hour = now.getHours();
  const { greeting, icon: greetIcon, color: greetColor } =
    hour < 11
      ? { greeting: 'Chào buổi sáng', icon: 'sunrise', color: '#f59e0b' }
      : hour < 14
        ? { greeting: 'Chào buổi trưa', icon: 'sun', color: '#f59e0b' }
        : hour < 18
          ? { greeting: 'Chào buổi chiều', icon: 'sunset', color: '#f97316' }
          : { greeting: 'Chào buổi tối', icon: 'moonStar', color: '#818cf8' };

  const firstName = user?.name?.trim().split(/\s+/).slice(-1)[0] || 'bạn';

  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = new Intl.DateTimeFormat('vi-VN', dateOptions).format(now);

  return (
    <>
      <header className="page-head">
        <div>
          <div className="page-head__date-chip">
            <Icon name="calendar" size={13} />
            <span>{formattedDate}</span>
          </div>
          <h1>
            {greeting}, {firstName}!
            <Icon name={greetIcon} className="greet-icon" style={{ color: greetColor }} />
          </h1>
          <p>Đây là tổng quan tiến độ và kế hoạch công việc hôm nay của bạn.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setDialog({})}>
          <Icon name="plus" />
          Tạo công việc mới
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
                label="Tổng số công việc"
                value={stats.total}
                hint={`${stats.status.done} việc đã hoàn thành`}
                tone="stat--accent"
                pill={<span className="pill pill--neutral">Tổng quan</span>}
              />
              <StatCard
                icon="target"
                label="Đang tiến hành"
                value={stats.inProgress}
                hint="đang được tập trung xử lý"
                tone="stat--info"
                pill={<span className="pill pill--info">Đang làm</span>}
              />
              <StatCard
                icon="clock"
                label="Việc quá hạn"
                value={stats.overdue}
                tone={stats.overdue ? 'stat--danger' : 'stat--success'}
                hint={`${stats.dueToday} việc đến hạn hôm nay`}
                pill={
                  stats.overdue > 0 ? (
                    <span className="pill pill--danger">Cần xử lý ngay</span>
                  ) : (
                    <span className="pill pill--success">Rất đúng hạn</span>
                  )
                }
              />
              <StatCard
                icon="sparkles"
                label="Hoàn thành 7 ngày qua"
                value={stats.completedThisWeek}
                tone="stat--success"
                hint="Năng suất tuần này của bạn"
                pill={
                  <span className="pill pill--success">
                    <Icon name="trendingUp" size={12} />
                    Tiến độ tốt
                  </span>
                }
              />
            </section>

            <div className="two-col two-col--stretch">
              <section className="card card--interactive">
                <div className="card__head">
                  <div className="card__title-group">
                    <Icon name="target" className="card__title-icon" />
                    <h2>Tiến độ tổng thể</h2>
                  </div>
                  <Link to="/board" className="link">
                    Xem bảng Kanban <Icon name="arrowRight" size={13} />
                  </Link>
                </div>

                <div className="ring-wrap">
                  <ProgressRing value={stats.completionRate} />

                  <ul className="legend">
                    {STATUSES.map((s) => {
                      const count = stats.status[s.value] || 0;
                      const percent = stats.total ? Math.round((count / stats.total) * 100) : 0;
                      return (
                        <li key={s.value} className="legend__item">
                          <span className="legend__dot" style={{ background: s.color }} />
                          <span className="legend__name">{s.label}</span>
                          <span className="legend__bar">
                            <span style={{ width: `${percent}%`, background: s.color }} />
                          </span>
                          <strong className="legend__count">{count}</strong>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </section>

              <section className="card card--interactive">
                <div className="card__head">
                  <div className="card__title-group">
                    <Icon name="clock" className="card__title-icon" />
                    <h2>Sắp đến hạn chót</h2>
                  </div>
                  <Link to="/tasks?due=week" className="link">
                    Xem tất cả <Icon name="arrowRight" size={13} />
                  </Link>
                </div>

                {stats.upcoming.length === 0 ? (
                  <EmptyState
                    icon="sparkles"
                    title="Không có hạn chót nào sắp tới"
                    description="Bạn đang kiểm soát rất tốt mọi tiến độ công việc!"
                    action={
                      <button type="button" className="btn btn--ghost btn--sm" onClick={() => setDialog({})}>
                        <Icon name="plus" size={13} /> Tạo việc mới
                      </button>
                    }
                  />
                ) : (
                  <ul className="upcoming">
                    {stats.upcoming.map((task) => {
                      const due = dueLabel(task.dueDate, task.status);
                      const isDone = task.status === 'done';
                      return (
                        <li key={task._id} className="upcoming__row">
                          <button
                            type="button"
                            className={`upcoming__check-btn ${isDone ? 'checked' : ''}`}
                            onClick={(e) => toggleTaskStatus(task, e)}
                            title={isDone ? 'Chưa xong' : 'Hoàn thành'}
                          >
                            <Icon name="check" size={12} />
                          </button>

                          <button type="button" className="upcoming__item" onClick={() => setDialog(task)}>
                            <PriorityBadge priority={task.priority} showLabel={false} />
                            <div className="upcoming__info">
                              <strong className={isDone ? 'done-text' : ''}>{task.title}</strong>
                              <div className="upcoming__meta">
                                <span className="muted-sm">
                                  {task.project ? (
                                    <span className="upcoming__project-tag" style={{ color: task.project.color }}>
                                      <i className="dot" style={{ background: task.project.color }} />
                                      {task.project.name}
                                    </span>
                                  ) : (
                                    'Không thuộc dự án'
                                  )}
                                </span>
                                {due && (
                                  <span className={`due due--${due.tone}`}>
                                    <Icon name="calendar" size={12} />
                                    {due.text}
                                  </span>
                                )}
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

            <section className="card card--interactive">
              <div className="card__head">
                <div className="card__title-group">
                  <Icon name="folder" className="card__title-icon" />
                  <h2>Dự án của bạn</h2>
                </div>
                <Link to="/projects" className="link">
                  Quản lý dự án <Icon name="arrowRight" size={13} />
                </Link>
              </div>

              {projects.length === 0 ? (
                <EmptyState
                  icon="folder"
                  title="Chưa có dự án nào"
                  description="Tạo dự án để nhóm các công việc và theo dõi tiến độ một cách khoa học."
                  action={
                    <Link to="/projects?new=1" className="btn btn--primary btn--sm">
                      <Icon name="plus" size={13} /> Tạo dự án đầu tiên
                    </Link>
                  }
                />
              ) : (
                <div className="project-mini-grid">
                  {projects.slice(0, 4).map((p) => {
                    const percent = p.stats.total ? Math.round((p.stats.done / p.stats.total) * 100) : 0;
                    return (
                      <Link key={p._id} to={`/board?project=${p._id}`} className="project-mini">
                        <div className="project-mini__top">
                          <span className="project-mini__dot" style={{ background: p.color }} />
                          <span className="project-mini__badge" style={{ color: p.color, background: `${p.color}18` }}>
                            {percent}%
                          </span>
                        </div>
                        <strong>{p.name}</strong>
                        <span className="muted-sm">
                          {p.stats.done}/{p.stats.total} công việc đã xong
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
