import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import Icon from '../components/icons';
import Select from '../components/Select';
import TaskDialog from '../components/TaskDialog';
import { EmptyState, ListSkeleton, PriorityBadge, StatusBadge } from '../components/ui';
import { PRIORITIES, STATUSES } from '../constants';
import { useToast } from '../context/ToastContext';
import useWorkspace from '../hooks/useWorkspace';
import { fireConfetti } from '../utils/confetti';
import { dueLabel } from '../utils/date';

const SORTS = [
  { value: 'createdAt', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'dueDate', label: 'Hạn chót gần nhất' },
  { value: 'priority', label: 'Ưu tiên cao nhất' },
  { value: 'title', label: 'Tên A → Z' },
];

export default function Tasks() {
  const toast = useToast();
  const { projects } = useWorkspace();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const searchTimer = useRef(null);

  const query = Object.fromEntries(params);

  const load = useCallback(async () => {
    try {
      const { new: _n, task: _t, ...filters } = Object.fromEntries(params);
      const res = await api.get('/tasks', { params: { limit: 15, ...filters } });
      setData(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  // Bảng lệnh (⌘K) và phím tắt N điều hướng tới đây kèm tham số
  useEffect(() => {
    const wantsNew = params.get('new');
    const taskId = params.get('task');
    if (!wantsNew && !taskId) return;

    const clear = () => {
      const next = new URLSearchParams(params);
      next.delete('new');
      next.delete('task');
      setParams(next, { replace: true });
    };

    if (wantsNew) {
      setDialog({});
      clear();
      return;
    }

    api
      .get(`/tasks/${taskId}`)
      .then(({ data }) => setDialog(data.task))
      .catch((err) => toast.error(err.message))
      .finally(clear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  const toggleDone = async (task) => {
    const nextStatus = task.status === 'done' ? 'todo' : 'done';
    try {
      await api.patch(`/tasks/${task._id}`, { status: nextStatus });
      if (nextStatus === 'done') {
        fireConfetti(0.5, 0.4);
        toast.success(`Đã hoàn thành "${task.title}"! 🎉`);
      } else {
        toast.info(`Đã mở lại "${task.title}"`);
      }
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const hasFilters = [...params.keys()].some((k) => k !== 'new' && k !== 'task');

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Danh sách công việc</h1>
          <p>
            Tìm thấy <strong className="num">{data.total}</strong> công việc phù hợp với điều kiện tìm kiếm.
          </p>
        </div>
        <div className="page-head__actions">
          <div className="view-toggle" role="group" aria-label="Kiểu hiển thị">
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Dạng bảng"
            >
              <Icon name="list" size={16} />
            </button>
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              title="Dạng thẻ lưới"
            >
              <Icon name="layoutGrid" size={16} />
            </button>
          </div>

          <button type="button" className="btn btn--primary" onClick={() => setDialog({})}>
            <Icon name="plus" />
            Tạo công việc mới
          </button>
        </div>
      </header>

      <div className="filters">
        <div className="search-wrap">
          <Icon name="search" />
          <input
            placeholder="Tìm theo tên, mô tả, thẻ..."
            defaultValue={query.q || ''}
            onChange={(e) => {
              const value = e.target.value;
              clearTimeout(searchTimer.current);
              searchTimer.current = setTimeout(() => setFilter('q', value), 300);
            }}
          />
          {query.q && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => {
                const searchInput = document.querySelector('.search-wrap input');
                if (searchInput) searchInput.value = '';
                setFilter('q', '');
              }}
              aria-label="Xóa tìm kiếm"
            >
              <Icon name="x" size={13} />
            </button>
          )}
        </div>

        <Select
          value={query.status || ''}
          onChange={(v) => setFilter('status', v)}
          ariaLabel="Lọc theo trạng thái"
          options={[
            { value: '', label: 'Mọi trạng thái' },
            ...STATUSES.map((x) => ({ value: x.value, label: x.label, color: x.color })),
          ]}
        />

        <Select
          value={query.priority || ''}
          onChange={(v) => setFilter('priority', v)}
          ariaLabel="Lọc theo mức ưu tiên"
          options={[
            { value: '', label: 'Mọi mức ưu tiên' },
            ...PRIORITIES.map((x) => ({ value: x.value, label: x.label, color: x.color })),
          ]}
        />

        <Select
          value={query.project || ''}
          onChange={(v) => setFilter('project', v)}
          ariaLabel="Lọc theo dự án"
          options={[
            { value: '', label: 'Tất cả dự án' },
            { value: 'none', label: 'Không thuộc dự án' },
            ...projects.map((x) => ({ value: x._id, label: x.name, color: x.color })),
          ]}
        />

        <Select
          value={query.due || ''}
          onChange={(v) => setFilter('due', v)}
          ariaLabel="Lọc theo hạn chót"
          options={[
            { value: '', label: 'Mọi hạn chót' },
            { value: 'overdue', label: 'Quá hạn' },
            { value: 'today', label: 'Hôm nay' },
            { value: 'week', label: '7 ngày tới' },
          ]}
        />

        <Select
          value={query.sort || 'createdAt'}
          onChange={(v) => setFilter('sort', v)}
          ariaLabel="Sắp xếp"
          options={SORTS}
        />

        {hasFilters && (
          <button type="button" className="btn btn--subtle btn--clear-filter" onClick={() => setParams({})}>
            <Icon name="x" size={14} />
            Xoá bộ lọc
          </button>
        )}
      </div>

      {loading ? (
        <ListSkeleton rows={8} />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon="search"
          title="Không tìm thấy công việc nào"
          description="Thử đổi tiêu chí tìm kiếm hoặc tạo một công việc mới."
          action={
            <button type="button" className="btn btn--primary" onClick={() => setDialog({})}>
              <Icon name="plus" />
              Tạo công việc ngay
            </button>
          }
        />
      ) : viewMode === 'table' ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 44 }} />
                <th>Tên công việc & Dự án</th>
                <th style={{ width: 140 }}>Trạng thái</th>
                <th style={{ width: 130 }}>Ưu tiên</th>
                <th style={{ width: 160 }}>Hạn chót</th>
                <th style={{ width: 60 }} />
              </tr>
            </thead>
            <tbody>
              {data.items.map((task) => {
                const due = dueLabel(task.dueDate, task.status);
                const isDone = task.status === 'done';
                return (
                  <tr key={task._id} className={isDone ? 'row--done' : ''}>
                    <td>
                      <label className="checkbox-custom">
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => toggleDone(task)}
                          title={isDone ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
                        />
                        <span className="checkbox-box">
                          <Icon name="check" size={12} />
                        </span>
                      </label>
                    </td>
                    <td>
                      <button type="button" className="cell-title" onClick={() => setDialog(task)}>
                        <strong>{task.title}</strong>
                        <span className="muted-sm cell-meta">
                          {task.project ? (
                            <span className="chip chip--project" style={{ color: task.project.color, background: `${task.project.color}15` }}>
                              <i className="dot" style={{ background: task.project.color }} />
                              {task.project.name}
                            </span>
                          ) : (
                            <span>Không thuộc dự án</span>
                          )}
                          {task.tags?.length > 0 &&
                            task.tags.map((t) => (
                              <span key={t} className="tag">
                                #{t}
                              </span>
                            ))}
                          {task.comments?.length > 0 && (
                            <span className="comment-badge" title={`${task.comments.length} ghi chú`}>
                              <Icon name="message" size={11} />
                              {task.comments.length}
                            </span>
                          )}
                        </span>
                      </button>
                    </td>
                    <td>
                      <StatusBadge status={task.status} />
                    </td>
                    <td>
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td>
                      {due ? (
                        <span className={`due due--${due.tone}`}>
                          <Icon name="calendar" size={13} />
                          {due.text}
                        </span>
                      ) : (
                        <span className="muted-sm">—</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="icon-btn icon-btn--edit"
                        onClick={() => setDialog(task)}
                        title="Chỉnh sửa chi tiết"
                      >
                        <Icon name="pencil" size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="task-cards-grid">
          {data.items.map((task) => {
            const due = dueLabel(task.dueDate, task.status);
            const isDone = task.status === 'done';
            return (
              <article
                key={task._id}
                className={`task-card-item ${isDone ? 'task-card-item--done' : ''}`}
                onClick={() => setDialog(task)}
              >
                <div className="task-card-item__top">
                  <PriorityBadge priority={task.priority} />
                  <StatusBadge status={task.status} />
                  <button
                    type="button"
                    className={`task-card-item__check ${isDone ? 'checked' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDone(task);
                    }}
                    title={isDone ? 'Đánh dấu chưa xong' : 'Hoàn thành'}
                  >
                    <Icon name="check" size={12} />
                  </button>
                </div>

                <h4 className="task-card-item__title">{task.title}</h4>

                {task.description && (
                  <p className="task-card-item__desc">{task.description}</p>
                )}

                <div className="task-card-item__foot">
                  {task.project ? (
                    <span
                      className="chip chip--project"
                      style={{ color: task.project.color, background: `${task.project.color}15` }}
                    >
                      <i className="dot" style={{ background: task.project.color }} />
                      {task.project.name}
                    </span>
                  ) : (
                    <span className="muted-sm">Chưa gắn dự án</span>
                  )}

                  {due && (
                    <span className={`due due--${due.tone}`}>
                      <Icon name="calendar" size={12} />
                      {due.text}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {data.pages > 1 && (
        <div className="pagination">
          <button
            type="button"
            className="btn btn--ghost"
            disabled={data.page <= 1}
            onClick={() => setFilter('page', String(data.page - 1))}
          >
            <Icon name="chevronLeft" />
            Trang trước
          </button>
          <span className="pagination-info num">
            Trang <strong>{data.page}</strong> / <strong>{data.pages}</strong>
          </span>
          <button
            type="button"
            className="btn btn--ghost"
            disabled={data.page >= data.pages}
            onClick={() => setFilter('page', String(data.page + 1))}
          >
            Trang sau
            <Icon name="chevronRight" />
          </button>
        </div>
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
