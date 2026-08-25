import Icon from './icons';
import Logo from './Logo';

const POINTS = [
  { text: 'Bảng Kanban kéo thả trực quan & linh hoạt', icon: 'kanban' },
  { text: 'Theo dõi hạn chót thông minh & chuỗi streak', icon: 'flame' },
  { text: 'Phân nhóm theo dự án với màu sắc nhận diện', icon: 'folder' },
  { text: 'Ghi chú & trao đổi ngay trong công việc', icon: 'message' },
];

export default function AuthAside() {
  return (
    <aside className="auth__aside">
      <div className="auth__aside-mesh" />

      <div className="brand">
        <Logo size={40} variant="glass" />
        <div>
          <strong>WorkQueue</strong>
          <small>Quản lý công việc thông minh</small>
        </div>
      </div>

      <div className="auth__pitch">
        <span className="auth__badge">
          <Icon name="sparkles" size={14} />
          Nâng cao hiệu suất nhóm
        </span>
        <h2>Quản lý công việc dễ dàng, trực quan và đúng hạn.</h2>
        <p>Mọi đầu việc đều rõ ràng ai làm, tiến độ đến đâu, hạn chót khi nào — không còn thất lạc hay bỏ sót.</p>

        {/* Mini Preview Widget */}
        <div className="auth__preview-card">
          <div className="auth__preview-header">
            <span className="auth__preview-dot auth__preview-dot--red" />
            <span className="auth__preview-dot auth__preview-dot--yellow" />
            <span className="auth__preview-dot auth__preview-dot--green" />
            <span className="auth__preview-title">Bảng tiến độ hôm nay</span>
          </div>
          <div className="auth__preview-task">
            <div className="auth__preview-check">
              <Icon name="check" size={12} />
            </div>
            <div className="auth__preview-info">
              <span>Thiết kế lại giao diện Kanban</span>
              <small>Dự án WorkQueue · Hoàn thành</small>
            </div>
            <span className="auth__preview-tag">🔥 5 ngày liên tiếp</span>
          </div>
        </div>

        <ul className="auth__points">
          {POINTS.map((point) => (
            <li key={point.text}>
              <span className="auth__point-icon">
                <Icon name={point.icon} size={14} />
              </span>
              <span>{point.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="auth__aside-foot">
        <p className="auth__note">WorkQueue v2.0 · Trải nghiệm hiện đại & tối ưu</p>
      </div>
    </aside>
  );
}
