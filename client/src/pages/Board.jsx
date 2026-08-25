import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import Icon from '../components/icons';
import Select from '../components/Select';
import TaskCard from '../components/TaskCard';
import TaskDialog from '../components/TaskDialog';
import { ListSkeleton } from '../components/ui';
import { PRIORITIES, STATUSES } from '../constants';
import { useToast } from '../context/ToastContext';
import useWorkspace from '../hooks/useWorkspace';
import { fireConfetti } from '../utils/confetti';

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

    if (status === 'done' && from !== 'done') {
      fireConfetti(0.7, 0.4);
    }

    try {
      await api.patch(`/tasks/${task._id}/move`, { status, index: insertAt });
    } catch (err) {
      toast.error(err.message);
      load();
    }
  };

  /** Thao tác đánh dấu hoàn thành trực tiếp trên thẻ */
  const toggleComplete = async (task) => {
    const nextStatus = task.status === 'done' ? 'todo' : 'done';
    const from = task.status;

    const next = { ...columns };
    next[from] = next[from].filter((t) => t._id !== task._id);
    next[nextStatus] = [{ ...task, status: nextStatus }, ...next[nextStatus]];
    setColumns(next);

    if (nextStatus === 'done') {
      fireConfetti(0.7, 0.4);
      toast.success('Đã hoàn thành công việc! 🎉');
    }

    try {
      await api.patch(`/tasks/${task._id}`, { status: nextStatus });
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
    setAdding(null);

    try {
      await api.post('/tasks', { title, status, project });
      toast.success('Đã tạo công việc');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const hasFilters = params.toString().length > 0;
  const totalTasks = Object.values(columns).reduce((acc, list) => acc + list.length, 0);

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Bảng Kanban</h1>
          <p>
            Kéo thả thẻ để cập nhật trạng thái · Tổng số <strong className="num">{totalTasks}</strong> công việc
          </p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setDialog({})}>
          <Icon name="plus" />
          Tạo công việc mới
        </button>
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
          value={query.project || ''}
          onChange={(v) => setFilter('project', v)}
          ariaLabel="Lọc theo dự án"
          options={[
            { value: '', label: 'Tất cả dự án' },
            { value: 'none', label: 'Không thuộc dự án' },
            ...projects.map((p) => ({ value: p._id, label: p.name, color: p.color })),
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

        {hasFilters && (
          <button type="button" className="btn btn--subtle btn--clear-filter" onClick={() => setParams({})}>
            <Icon name="x" size={14} />
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
                className={`column${isOver ? ' column--over' : ''} column--${status.value}`}
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
                        onToggleComplete={toggleComplete}
                      />
                    </div>
                  ))}

                  {isOver && over.index >= items.length && <div className="drop-line" />}

                  {items.length === 0 && !isOver && (
                    <div className="column__empty">
                      <Icon name="inbox" size={20} />
                      <p>Kéo thẻ hoặc bấm thêm mới</p>
                    </div>
                  )}
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
                      placeholder="Tiêu đề công việc mới..."
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
                    <Icon name="plus" size={14} />
                    <span>Thêm công việc</span>
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
