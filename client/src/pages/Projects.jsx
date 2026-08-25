import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import Icon from '../components/icons';
import { ConfirmDialog, EmptyState, ListSkeleton, Modal } from '../components/ui';
import { PROJECT_COLORS } from '../constants';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/date';

const EMPTY = { name: '', description: '', color: PROJECT_COLORS[0] };

export default function Projects() {
  const toast = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [params, setParams] = useSearchParams();

  const load = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data.projects);
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

  // Mở sẵn form khi tới từ bảng lệnh (⌘K)
  useEffect(() => {
    if (!params.get('new')) return;
    openDialog();
    setParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const openDialog = (project = null) => {
    setError('');
    setEditing(project || {});
    setForm(
      project
        ? {
            name: project.name,
            description: project.description || '',
            color: project.color,
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
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(null);
    }
  };


  return (
    <>
      <header className="page-head">
        <div>
          <h1>Dự án</h1>
          <p>Nhóm công việc theo từng dự án và theo dõi tiến độ.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => openDialog()}>
          <Icon name="plus" />
          Dự án mới
        </button>
      </header>

      {loading ? (
        <ListSkeleton rows={4} />
      ) : projects.length === 0 ? (
        <EmptyState
          icon="folder"
          title="Chưa có dự án nào"
          description="Tạo dự án đầu tiên để bắt đầu tổ chức công việc."
          action={
            <button type="button" className="btn btn--primary" onClick={() => openDialog()}>
              <Icon name="plus" />
              Tạo dự án
            </button>
          }
        />
      ) : (
        <div className="project-grid">
          {projects.map((project) => {
            const percent = project.stats.total ? Math.round((project.stats.done / project.stats.total) * 100) : 0;

            return (
              <article key={project._id} className="project-card" style={{ '--project-color': project.color }}>
                <header>
                  <h3>{project.name}</h3>
                  <div className="project-card__actions">
                    <button type="button" className="icon-btn" onClick={() => openDialog(project)} title="Sửa">
                      <Icon name="pencil" />
                    </button>
                    <button
                      type="button"
                      className="icon-btn icon-btn--danger"
                      onClick={() => setDeleting(project)}
                      title="Xoá"
                    >
                      <Icon name="trash" />
                    </button>
                  </div>
                </header>

                <p className="project-card__desc">{project.description || 'Chưa có mô tả.'}</p>

                <div className="progress-thin">
                  <span style={{ width: `${percent}%`, background: project.color }} />
                </div>
                <span className="muted-sm num">
                  {project.stats.done}/{project.stats.total} công việc hoàn thành ({percent}%)
                </span>

                <footer>                  <Link to={`/board?project=${project._id}`} className="link">
                    Xem bảng <Icon name="arrowRight" width={13} height={13} />
                  </Link>
                </footer>

                <small className="muted-sm">Tạo ngày {formatDate(project.createdAt)}</small>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?._id ? 'Sửa dự án' : 'Tạo dự án mới'}
      >
        <form onSubmit={submit} className="form">
          {error && (
            <div className="alert alert--error">
              <Icon name="alert" />
              {error}
            </div>
          )}

          <label className="field">
            <span>Tên dự án *</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ví dụ: Website bán hàng"
              autoFocus
            />
          </label>

          <label className="field">
            <span>Mô tả</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Dự án này nhằm mục đích gì?"
            />
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


          <div className="row-end">
            <button type="button" className="btn btn--ghost" onClick={() => setEditing(null)}>
              Huỷ
            </button>
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
