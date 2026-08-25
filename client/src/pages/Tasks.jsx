import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import TaskDialog from '../components/TaskDialog';
import { Avatar, EmptyState, PriorityBadge, Spinner, StatusBadge } from '../components/ui';
import { PRIORITIES, STATUSES } from '../constants';
import { useToast } from '../context/ToastContext';
import useWorkspace from '../hooks/useWorkspace';
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
  const { projects, users } = useWorkspace();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null);
  const searchTimer = useRef(null);

  const query = Object.fromEntries(params);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/tasks', { params: { limit: 15, ...Object.fromEntries(params) } });
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

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  const toggleDone = async (task) => {
    try {
      await api.patch(`/tasks/${task._id}`, { status: task.status === 'done' ? 'todo' : 'done' });
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Danh sách công việc</h1>
          <p className="muted">{data.total} công việc phù hợp với bộ lọc hiện tại.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setDialog({})}>+ Công việc mới</button>
      </header>

      <div className="filters">
        <input
          className="search"
          placeholder="🔍 Tìm công việc..."
          defaultValue={query.q || ''}
          onChange={(e) => {
            const value = e.target.value;
            clearTimeout(searchTimer.current);
            searchTimer.current = setTimeout(() => setFilter('q', value), 350);
          }}
        />

        <select value={query.status || ''} onChange={(e) => setFilter('status', e.target.value)}>
          <option value="">Mọi trạng thái</option>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        <select value={query.priority || ''} onChange={(e) => setFilter('priority', e.target.value)}>
          <option value="">Mọi mức ưu tiên</option>
          {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>

        <select value={query.project || ''} onChange={(e) => setFilter('project', e.target.value)}>
          <option value="">Tất cả dự án</option>
          <option value="none">Không thuộc dự án</option>
          {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>

        <select value={query.assignee || ''} onChange={(e) => setFilter('assignee', e.target.value)}>
          <option value="">Mọi người</option>
          <option value="me">Của tôi</option>
          <option value="none">Chưa giao</option>
          {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
        </select>

        <select value={query.due || ''} onChange={(e) => setFilter('due', e.target.value)}>
          <option value="">Mọi hạn chót</option>
          <option value="overdue">Quá hạn</option>
          <option value="today">Hôm nay</option>
          <option value="week">7 ngày tới</option>
        </select>

        <select value={query.sort || 'createdAt'} onChange={(e) => setFilter('sort', e.target.value)}>
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        {params.toString() && (
          <button type="button" className="btn btn--ghost" onClick={() => setParams({})}>Xoá bộ lọc</button>
        )}
      </div>

      {loading ? (
        <Spinner />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="Không tìm thấy công việc nào"
          description="Thử đổi bộ lọc hoặc tạo một công việc mới."
          action={<button type="button" className="btn btn--primary" onClick={() => setDialog({})}>+ Tạo công việc</button>}
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 40 }} />
                <th>Công việc</th>
                <th style={{ width: 130 }}>Trạng thái</th>
                <th style={{ width: 110 }}>Ưu tiên</th>
                <th style={{ width: 150 }}>Hạn chót</th>
                <th style={{ width: 60 }}>Người làm</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((task) => {
                const due = dueLabel(task.dueDate, task.status);
                return (
                  <tr key={task._id} className={task.status === 'done' ? 'row--done' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={task.status === 'done'}
                        onChange={() => toggleDone(task)}
                        title="Đánh dấu hoàn thành"
                      />
                    </td>
                    <td>
                      <button type="button" className="cell-title" onClick={() => setDialog(task)}>
                        <strong>{task.title}</strong>
                        <span className="muted-sm">
                          {task.project?.name || 'Không thuộc dự án'}
                          {task.tags?.length > 0 && ` · ${task.tags.map((t) => `#${t}`).join(' ')}`}
                        </span>
                      </button>
                    </td>
                    <td><StatusBadge status={task.status} /></td>
                    <td><PriorityBadge priority={task.priority} /></td>
                    <td>{due ? <span className={`due due--${due.tone}`}>{due.text}</span> : <span className="muted-sm">—</span>}</td>
                    <td><Avatar user={task.assignee} size={28} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
            ← Trước
          </button>
          <span className="muted-sm">Trang {data.page} / {data.pages}</span>
          <button
            type="button"
            className="btn btn--ghost"
            disabled={data.page >= data.pages}
            onClick={() => setFilter('page', String(data.page + 1))}
          >
            Sau →
          </button>
        </div>
      )}

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
