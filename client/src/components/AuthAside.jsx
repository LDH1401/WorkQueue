import Icon from './icons';
import Logo from './Logo';

const POINTS = [
  'Bảng Kanban kéo thả trực quan',
  'Giao việc, đặt hạn chót, gắn thẻ',
  'Theo dõi tiến độ từng dự án',
  'Bình luận trao đổi ngay trong công việc',
];

/** Panel thương hiệu bên trái của màn hình đăng nhập / đăng ký */
export default function AuthAside() {
  return (
    <aside className="auth__aside">
      <div className="brand">
        <Logo size={38} variant="glass" />
        <div>
          <strong>WorkQueue</strong>
          <small>Quản lý công việc</small>
        </div>
      </div>

      <div className="auth__pitch">
        <h2>Đưa mọi việc của nhóm về một nơi.</h2>
        <p>Không còn bảng tính rối rắm hay tin nhắn thất lạc — mọi đầu việc đều rõ ai làm, làm đến đâu, hạn khi nào.</p>

        <ul className="auth__points">
          {POINTS.map((point) => (
            <li key={point}>
              <span>
                <Icon name="check" />
              </span>
              {point}
            </li>
          ))}
        </ul>
      </div>

      <p className="auth__note">React · Express · MongoDB</p>
    </aside>
  );
}
