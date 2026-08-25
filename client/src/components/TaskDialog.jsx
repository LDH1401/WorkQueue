import { useEffect, useState } from 'react';
import api from '../api/client';
import { PRIORITIES, STATUSES } from '../constants';
import { useToast } from '../context/ToastContext';
import { fireConfetti } from '../utils/confetti';
import { joinDue, relativeTime, splitDue } from '../utils/date';
import Icon from './icons';
import Select from './Select';
import { ConfirmDialog, Modal } from './ui';

const EMPTY = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  dueDate: '',
  dueTime: '',
  project: '',
  tags: '',
};

export default function TaskDialog({ open, task, projects = [], onClose, onSaved, onDeleted }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [current, setCurrent] = useState(task);
  const [confirming, setConfirming] = useState(false);

  const isEdit = Boolean(task?._id);

  useEffect(() => {
    setCurrent(task);
    setError('');
    setComment('');
    setForm(
      task
        ? {
            title: task.title || '',
            description: task.description || '',
            status: task.status || 'todo',
            priority: task.priority || 'medium',
            dueDate: splitDue(task.dueDate).date,
            dueTime: splitDue(task.dueDate).time,
            project: task.project?._id || task.project || '',
            tags: (task.tags || []).join(', '),
          }
        : EMPTY
    );
  }, [task, open]);

  const setField = (name) => (e) => setForm((prev) => ({ ...prev, [name]: e.target.value }));

  /** Quick due date presets */
  const setQuickDate = (daysAhead) => {
    if (daysAhead === null) {
      setForm((prev) => ({ ...prev, dueDate: '', dueTime: '' }));
      return;
    }
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    setForm((prev) => ({ ...prev, dueDate: dateStr }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setError('Vui lòng nhập tiêu đề công việc');

    setSaving(true);
    setError('');
    try {
      const { dueTime, ...rest } = form;
      const payload = {
        ...rest,
        title: form.title.trim(),
        dueDate: joinDue(form.dueDate, form.dueTime),
        project: form.project || null,
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };

      const wasNotDone = !task || task.status !== 'done';
      const isNowDone = payload.status === 'done';

      const { data } = isEdit ? await api.patch(`/tasks/${task._id}`, payload) : await api.post('/tasks', payload);

      if (wasNotDone && isNowDone) {
        fireConfetti(0.5, 0.4);
      }

      toast.success(isEdit ? 'Đã cập nhật công việc' : 'Đã tạo công việc mới');
      onSaved?.(data.task);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    const id = task._id;
    try {
      await api.delete(`/tasks/${id}`);

      toast.undo('Đã xoá công việc', async () => {
        try {
          await api.post(`/tasks/${id}/restore`);
          toast.success('Đã khôi phục công việc');
        } catch (err) {
          toast.error(err.message);
        } finally {
          onDeleted?.();
        }
      });

      onDeleted?.(id);
      setConfirming(false);
      onClose();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const sendComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      const { data } = await api.post(`/tasks/${task._id}/comments`, { body: comment.trim() });
      setCurrent(data.task);
      onSaved?.(data.task, { silent: true });
      setComment('');
      toast.success('Đã thêm ghi chú');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const removeComment = async (commentId) => {
    try {
      const { data } = await api.delete(`/tasks/${task._id}/comments/${commentId}`);
      setCurrent(data.task);
      onSaved?.(data.task, { silent: true });
      toast.info('Đã xóa ghi chú');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={
          <div className="task-dialog__head-title">
            <span className="task-dialog__title-icon">
              <Icon name={isEdit ? 'pencil' : 'plus'} />
            </span>
            <span>{isEdit ? 'Chi tiết công việc' : 'Tạo công việc mới'}</span>
          </div>
        }
        width={680}
      >
        <form onSubmit={submit} className="form">
          {error && (
            <div className="alert alert--error">
              <Icon name="alert" />
              {error}
            </div>
          )}

          <label className="field">
            <span>Tiêu đề công việc *</span>
            <input
              value={form.title}
              onChange={setField('title')}
              placeholder="Ví dụ: Thiết kế giao diện trang chủ..."
              autoFocus
              className="input-prominent"
            />
          </label>

          <label className="field">
            <span>Mô tả chi tiết</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={setField('description')}
              placeholder="Thêm mô tả, yêu cầu kỹ thuật hoặc mục tiêu cụ thể..."
            />
          </label>

          <div className="grid-2">
            <div className="field">
              <span>Trạng thái</span>
              <Select
                value={form.status}
                onChange={(v) => setForm((prev) => ({ ...prev, status: v }))}
                ariaLabel="Trạng thái"
                options={STATUSES.map((x) => ({ value: x.value, label: x.label, color: x.color }))}
              />
            </div>

            <div className="field">
              <span>Độ ưu tiên</span>
              <Select
                value={form.priority}
                onChange={(v) => setForm((prev) => ({ ...prev, priority: v }))}
                ariaLabel="Độ ưu tiên"
                options={PRIORITIES.map((x) => ({ value: x.value, label: x.label, color: x.color }))}
              />
            </div>

            <div className="field field--full">
              <div className="field-header-row">
                <span>Hạn chót</span>
                <div className="due-presets">
                  <button type="button" className="due-preset-btn" onClick={() => setQuickDate(0)}>
                    Hôm nay
                  </button>
                  <button type="button" className="due-preset-btn" onClick={() => setQuickDate(1)}>
                    Ngày mai
                  </button>
                  <button type="button" className="due-preset-btn" onClick={() => setQuickDate(7)}>
                    +7 ngày
                  </button>
                  {form.dueDate && (
                    <button type="button" className="due-preset-btn due-preset-btn--clear" onClick={() => setQuickDate(null)}>
                      Xóa hạn
                    </button>
                  )}
                </div>
              </div>
              <div className="due-inputs">
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => {
                    const date = e.target.value;
                    setForm((prev) => ({ ...prev, dueDate: date, dueTime: date ? prev.dueTime : '' }));
                  }}
                  aria-label="Ngày hết hạn"
                />
                <input
                  type="time"
                  value={form.dueTime}
                  onChange={setField('dueTime')}
                  disabled={!form.dueDate}
                  placeholder="--:--"
                  aria-label="Giờ hết hạn"
                />
              </div>
              <small className="field__hint">
                {form.dueDate && !form.dueTime ? 'Không nhập giờ = tính hạn cuối ngày (23:59)' : 'Giờ là tùy chọn'}
              </small>
            </div>

            <div className="field">
              <span>Dự án</span>
              <Select
                value={form.project}
                onChange={(v) => setForm((prev) => ({ ...prev, project: v }))}
                ariaLabel="Dự án"
                options={[
                  { value: '', label: 'Không thuộc dự án' },
                  ...projects.map((x) => ({ value: x._id, label: x.name, color: x.color })),
                ]}
              />
            </div>

            <label className="field">
              <span>Thẻ (tags)</span>
              <input value={form.tags} onChange={setField('tags')} placeholder="ui, frontend, quan-trong..." />
            </label>
          </div>

          <div className="dialog-actions-row">
            {isEdit && (
              <button type="button" className="btn btn--danger-ghost mr-auto" onClick={() => setConfirming(true)}>
                <Icon name="trash" />
                Xoá công việc
              </button>
            )}
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Huỷ
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo công việc'}
            </button>
          </div>
        </form>

        {isEdit && (
          <section className="comments">
            <div className="comments-head">
              <h3>
                <Icon name="message" size={16} />
                Ghi chú & Trao đổi ({current?.comments?.length || 0})
              </h3>
            </div>

            <div className="comment-list">
              {current?.comments?.length ? (
                current.comments.map((c) => (
                  <div key={c._id} className="comment">
                    <div className="comment__body">
                      <div className="comment__head">
                        <span className="comment__time">{relativeTime(c.createdAt)}</span>
                        <button type="button" className="link-danger" onClick={() => removeComment(c._id)} title="Xóa ghi chú">
                          <Icon name="trash" size={13} />
                        </button>
                      </div>
                      <p>{c.body}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="comment-empty">
                  <p>Chưa có ghi chú nào. Hãy thêm ghi chú về tiến độ hoặc lưu ý!</p>
                </div>
              )}
            </div>

            <form onSubmit={sendComment} className="comment-form">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Nhập ghi chú hoặc cập nhật tiến độ..."
              />
              <button type="submit" className="btn btn--primary" disabled={!comment.trim()} aria-label="Gửi ghi chú">
                <Icon name="send" />
                <span>Gửi</span>
              </button>
            </form>
          </section>
        )}
      </Modal>

      <ConfirmDialog
        open={confirming}
        title="Xoá công việc này?"
        message={`Công việc "${task?.title}" sẽ bị xoá. Bạn vẫn có thể hoàn tác ngay sau khi xoá.`}
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
