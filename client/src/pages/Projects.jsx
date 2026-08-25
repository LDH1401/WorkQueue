import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Avatar, ConfirmDialog, EmptyState, Modal, Spinner } from '../components/ui';
import { PROJECT_COLORS } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/date';

const EMPTY = { name: '', description: '', color: PROJECT_COLORS[0], members: [] };

export default function Projects() {
  const { user } = useAuth();
  const toast = useToast();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [p, u] = await Promise.all([api.get('/projects'), api.get('/auth/users')]);
      setProjects(p.data.projects);
      setUsers(u.data.users);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDialog = (project = null) => {
    setError('');
    setEditing(project || {});
    setForm(
      project
        ? {
            name: project.name,
            description: project.description || '',
            color: project.color,
            members: project.members.map((m) => m._id),
          }
        : EMPTY
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Vui lòng nhập tên dự án');

    setSaving(true);
    setError('');
    try {
      if (editing?._id) await api.patch(`/projects/${editing._id}`, form);
      else await api.post('/projects', form);

      toast.success(editing?._id ? 'Đã cập nhật dự án' : 'Đã tạo dự án mới');
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await api.delete(`/projects/${deleting._id}`);
      toast.success('Đã xoá dự án');
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(err.message);
      setDeleting(null);
    }
  };

  const toggleMember = (id) =>
    setForm((prev) => ({
      ...prev,
      members: prev.members.includes(id) ? prev.members.filter((m) => m !== id) : [...prev.members, id],
    }));

  if (loading) return <Spinner />;

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Dự án</h1>
          <p className="muted">Nhóm công việc theo từng dự án và theo dõi tiến độ.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => openDialog()}>+ Dự án mới</button>
      </header>

      {projects.length === 0 ? (
        <EmptyState
          icon="📁"
          title="Chưa có dự án nào"
          description="Tạo dự án đầu tiên để bắt đầu tổ chức công việc."
          action={<button type="button" className="btn btn--primary" onClick={() => openDialog()}>+ Tạo dự án</button>}
        />
      ) : (
        <div className="project-grid">
          {projects.map((project) => {
            const percent = project.stats.total ? Math.round((project.stats.done / project.stats.total) * 100) : 0;
            const isOwner = project.owner._id === user?._id;

            return (
              <article key={project._id} className="project-card" style={{ borderTopColor: project.color }}>
                <header>
                  <h3>{project.name}</h3>
                  <div className="project-card__actions">
                    <button type="button" className="icon-btn" onClick={() => openDialog(project)} title="Sửa">✎</button>
                    {isOwner && (
                      <button type="button" className="icon-btn icon-btn--danger" onClick={() => setDeleting(project)} title="Xoá">🗑</button>
                    )}
                  </div>
                </header>

                <p className="project-card__desc">{project.description || 'Chưa có mô tả.'}</p>

                <div className="progress-thin">
                  <span style={{ width: `${percent}%`, background: project.color }} />
                </div>
                <span className="muted-sm">{project.stats.done}/{project.stats.total} công việc hoàn thành ({percent}%)</span>

                <footer>
                  <div className="avatar-stack">
                    {project.members.slice(0, 4).map((m) => <Avatar key={m._id} user={m} size={28} />)}
                    {project.members.length > 4 && <span className="avatar avatar--more">+{project.members.length - 4}</span>}
                  </div>
                  <Link to={`/board?project=${project._id}`} className="link">Xem bảng →</Link>
                </footer>

                <small className="muted-sm">Tạo ngày {formatDate(project.createdAt)}</small>
              </article>
            );
          })}
        </div>
      )}

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?._id ? 'Sửa dự án' : 'Tạo dự án mới'}>
        <form onSubmit={submit} className="form">
          {error && <div className="alert alert--error">{error}</div>}

          <label className="field">
            <span>Tên dự án *</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ví dụ: Website bán hàng" autoFocus />
          </label>

          <label className="field">
            <span>Mô tả</span>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>

          <div className="field">
            <span>Màu nhận diện</span>
            <div className="color-picker">
              {PROJECT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`swatch${form.color === color ? ' swatch--active' : ''}`}
                  style={{ background: color }}
                  onClick={() => setForm({ ...form, color })}
                  aria-label={`Chọn màu ${color}`}
                />
              ))}
            </div>
          </div>

          <div className="field">
            <span>Thành viên</span>
            <div className="member-picker">
              {users.map((u) => (
                <label key={u._id} className={`member${form.members.includes(u._id) ? ' member--on' : ''}`}>
                  <input type="checkbox" checked={form.members.includes(u._id)} onChange={() => toggleMember(u._id)} />
                  <Avatar user={u} size={26} />
                  {u.name}
                </label>
              ))}
            </div>
          </div>

          <div className="row-end">
            <button type="button" className="btn btn--ghost" onClick={() => setEditing(null)}>Huỷ</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Đang lưu...' : editing?._id ? 'Lưu thay đổi' : 'Tạo dự án'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Xoá dự án?"
        message={`Dự án "${deleting?.name}" sẽ bị xoá. Các công việc bên trong vẫn được giữ lại nhưng không còn thuộc dự án nào.`}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
