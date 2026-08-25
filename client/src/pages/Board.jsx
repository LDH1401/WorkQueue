import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import Icon from '../components/icons';
import TaskCard from '../components/TaskCard';
import TaskDialog from '../components/TaskDialog';
import { ListSkeleton } from '../components/ui';
import { PRIORITIES, STATUSES } from '../constants';
import { useToast } from '../context/ToastContext';
import useWorkspace from '../hooks/useWorkspace';

const EMPTY_COLUMNS = Object.fromEntries(STATUSES.map((s) => [s.value, []]));

export default function Board() {
  const toast = useToast();
  const { projects } = useWorkspace();
  const [params, setParams] = useSearchParams();
  const [columns, setColumns] = useState(EMPTY_COLUMNS);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null);
  const [adding, setAdding] = useState(null);
  const [draft, setDraft] = useState('');
  const [drag, setDrag] = useState(null);
  const [over, setOver] = useState(null);
  const searchTimer = useRef(null);

  const query = Object.fromEntries(params);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/tasks/board', { params: Object.fromEntries(params) });
      setColumns({ ...EMPTY_COLUMNS, ...data.columns });
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
    setParams(next);
  };

  /** Cập nhật lạc quan: đổi cột ngay trên UI rồi mới gọi API */
  const drop = async (status) => {
    if (!drag) return;

    const index = over?.status === status ? over.index : columns[status].length;
    const { task, from } = drag;

    setDrag(null);
    setOver(null);
    if (from === status && columns[status].findIndex((t) => t._id === task._id) === index) return;

    const next = { ...columns };
    next[from] = next[from].filter((t) => t._id !== task._id);
    const target = from === status ? next[from] : [...next[status]];
    const insertAt = Math.min(index, target.length);
    target.splice(insertAt, 0, { ...task, status });
    next[status] = target;
    setColumns(next);

    try {
      await api.patch(`/tasks/${task._id}/move`, { status, index: insertAt });
    } catch (err) {
      toast.error(err.message);
      load();
    }
  };

  /** Thêm nhanh: chỉ cần tiêu đề, tự kế thừa cột và dự án đang lọc */
  const quickAdd = async (status) => {
    const title = draft.trim();
    if (!title) return setAdding(null);

    const project = query.project && query.project !== 'none' ? query.project : null;
    setDraft('');

    try {
      await api.post('/tasks', { title, status, project });
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const hasFilters = params.toString().length > 0;

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Bảng Kanban</h1>
          <p>Kéo thả thẻ để đổi trạng thái công việc.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setDialog({})}>
          <Icon name="plus" />
          Công việc mới
        </button>
      </header>

      <div className="filters">
        <div className="search-wrap">
          <Icon name="search" />
          <input
            placeholder="Tìm theo tiêu đề, mô tả, thẻ..."
            defaultValue={query.q || ''}
            onChange={(e) => {
              const value = e.target.value;
              clearTimeout(searchTimer.current);
              searchTimer.current = setTimeout(() => setFilter('q', value), 350);
            }}
          />
        </div>

        <select value={query.project || ''} onChange={(e) => setFilter('project', e.target.value)}>
          <option value="">Tất cả dự án</option>
          <option value="none">Không thuộc dự án</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>


        <select value={query.priority || ''} onChange={(e) => setFilter('priority', e.target.value)}>
          <option value="">Mọi mức ưu tiên</option>
          {PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button type="button" className="btn btn--subtle" onClick={() => setParams({})}>
            <Icon name="x" />
            Xoá bộ lọc
          </button>
        )}
      </div>

      {loading ? (
        <ListSkeleton rows={5} />
      ) : (
        <div className="board">
          {STATUSES.map((status) => {
            const items = columns[status.value] || [];
            const isOver = drag && over?.status === status.value;

            return (
              <section
                key={status.value}
                className={`column${isOver ? ' column--over' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (items.length === 0) setOver({ status: status.value, index: 0 });
                }}
                onDrop={() => drop(status.value)}
              >
                <header className="column__head">
                  <span className="column__title">
                    <i className="dot" style={{ background: status.color }} />
                    {status.label}
                  </span>
                  <span className="count">{items.length}</span>
                </header>

                <div className="column__body">
                  {items.map((task, i) => (
                    <div
                      key={task._id}
                      className="card-slot"
                      style={{ '--i': i }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        const rect = e.currentTarget.getBoundingClientRect();
                        const after = e.clientY > rect.top + rect.height / 2;
                        setOver({ status: status.value, index: i + (after ? 1 : 0) });
                      }}
                    >
                      {isOver && over.index === i && <div className="drop-line" />}
                      <TaskCard
                        task={task}
                        draggable
                        dragging={drag?.task._id === task._id}
                        onDragStart={() => setDrag({ task, from: status.value })}
                        onDragEnd={() => {
                          setDrag(null);
                          setOver(null);
                        }}
                        onClick={setDialog}
                      />
                    </div>
                  ))}

                  {isOver && over.index >= items.length && <div className="drop-line" />}

                  {items.length === 0 && !isOver && <p className="column__empty">Kéo thẻ vào đây</p>}
                </div>

                {adding === status.value ? (
                  <form
                    className="quick-add"
                    onSubmit={(e) => {
                      e.preventDefault();
                      quickAdd(status.value);
                    }}
                  >
                    <textarea
                      autoFocus
                      rows={2}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Tiêu đề công việc..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          quickAdd(status.value);
                        } else if (e.key === 'Escape') {
                          setAdding(null);
                          setDraft('');
                        }
                      }}
                      onBlur={() => !draft.trim() && setAdding(null)}
                    />
                    <div className="quick-add__foot">
                      <button type="submit" className="btn btn--primary btn--sm" disabled={!draft.trim()}>
                        Thêm
                      </button>
                      <button
                        type="button"
                        className="btn btn--subtle btn--sm"
                        onClick={() => {
                          setAdding(null);
                          setDraft('');
                        }}
                      >
                        Huỷ
                      </button>
                      <span className="quick-add__hint">
                        <kbd>↵</kbd> lưu · <kbd>esc</kbd> huỷ
                      </span>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    className="column__add"
                    onClick={() => {
                      setDraft('');
                      setAdding(status.value);
                    }}
                  >
                    <Icon name="plus" />
                    Thêm công việc
                  </button>
                )}
              </section>
            );
          })}
        </div>
      )}

      <TaskDialog
        open={Boolean(dialog)}
        task={dialog && (dialog._id || dialog.status) ? dialog : null}
        projects={projects}
        onClose={() => setDialog(null)}
        onSaved={() => {
          setDialog(null);
          load();
        }}
        onDeleted={load}
      />
    </>
  );
}
