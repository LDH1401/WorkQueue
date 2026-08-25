import { useEffect, useState } from 'react';
import api from '../api/client';
import { PRIORITIES, STATUSES } from '../constants';
import { useToast } from '../context/ToastContext';
import { relativeTime, toInputDate } from '../utils/date';
import Icon from './icons';
import { ConfirmDialog, Modal } from './ui';

const EMPTY = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  dueDate: '',
  project: '',
  tags: '',
};

/**
 * Hộp thoại tạo mới / chỉnh sửa công việc.
 * task = null -> chế độ tạo mới
 */
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
            dueDate: toInputDate(task.dueDate),
            project: task.project?._id || task.project || '',
            tags: (task.tags || []).join(', '),
          }
        : EMPTY
    );
  }, [task, open]);

  const setField = (name) => (e) => setForm((prev) => ({ ...prev, [name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setError('Vui lòng nhập tiêu đề công việc');

    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        dueDate: form.dueDate || null,
        project: form.project || null,
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };

      const { data } = isEdit ? await api.patch(`/tasks/${task._id}`, payload) : await api.post('/tasks', payload);

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
    } catch (err) {
      toast.error(err.message);
    }
  };

  const removeComment = async (commentId) => {
    try {
      const { data } = await api.delete(`/tasks/${task._id}/comments/${commentId}`);
      setCurrent(data.task);
      onSaved?.(data.task, { silent: true });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <Modal open={open} onClose={onClose} title={isEdit ? 'Chi tiết công việc' : 'Tạo công việc mới'} width={660}>
        <form onSubmit={submit} className="form">
          {error && (
            <div className="alert alert--error">
              <Icon name="alert" />
              {error}
            </div>
          )}

          <label className="field">
            <span>Tiêu đề *</span>
            <input
              value={form.title}
              onChange={setField('title')}
              placeholder="Ví dụ: Thiết kế trang chủ"
              autoFocus
            />
          </label>

          <label className="field">
            <span>Mô tả</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={setField('description')}
              placeholder="Mô tả chi tiết công việc..."
            />
          </label>

          <div className="grid-2">
            <label className="field">
              <span>Trạng thái</span>
              <select value={form.status} onChange={setField('status')}>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Độ ưu tiên</span>
              <select value={form.priority} onChange={setField('priority')}>
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Hạn chót</span>
              <input type="date" value={form.dueDate} onChange={setField('dueDate')} />
            </label>

            <label className="field">
              <span>Dự án</span>
              <select value={form.project} onChange={setField('project')}>
                <option value="">— Không thuộc dự án —</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>


            <label className="field field--full">
              <span>Thẻ (cách nhau bởi dấu phẩy)</span>
              <input value={form.tags} onChange={setField('tags')} placeholder="backend, gấp" />
            </label>
          </div>

          <div className="row-end">
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
            <h3>Ghi chú ({current?.comments?.length || 0})</h3>

            <div className="comment-list">
              {current?.comments?.length ? (
                current.comments.map((c) => (
                  <div key={c._id} className="comment">
                    <div className="comment__body">
                      <div className="comment__head">
                        <span className="muted-sm">{relativeTime(c.createdAt)}</span>
                        <button type="button" className="link-danger" onClick={() => removeComment(c._id)}>
                          Xoá
                        </button>
                      </div>
                      <p>{c.body}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="muted-sm">Chưa có ghi chú nào.</p>
              )}
            </div>

            <form onSubmit={sendComment} className="comment-form">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Thêm ghi chú về tiến độ..."
              />
              <button type="submit" className="btn btn--primary" disabled={!comment.trim()} aria-label="Gửi">
                <Icon name="send" />
              </button>
            </form>
          </section>
        )}
      </Modal>

      <ConfirmDialog
        open={confirming}
        title="Xoá công việc?"
        message={`Công việc "${task?.title}" sẽ bị xoá vĩnh viễn. Bạn có chắc chắn không?`}
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
