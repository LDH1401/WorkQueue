import Icon from './icons';
import { useCountUp } from './ui';

const DAY_ICON = { hit: 'flame', miss: 'x', clean: 'check' };
const DAY_TOOLTIP = {
  hit: 'Đã hoàn thành đúng hạn',
  miss: 'Có việc trễ hạn',
  clean: 'Không có deadline trễ',
};

export default function StreakBanner({ streak }) {
  const { current, best, hasData, brokenToday, week } = streak;
  const shown = useCountUp(current);
  const alive = current > 0;

  const caption = !hasData
    ? 'Đặt hạn chót cho công việc để bắt đầu tính chuỗi đúng hẹn'
    : brokenToday
      ? 'Hôm nay có việc trễ hạn — ngày mai cùng lập chuỗi mới nhé!'
      : alive
        ? current >= best && best > 1
          ? '🎉 Tuyệt vời! Bạn đang ở mức kỷ lục của chính mình!'
          : '⚡ Giữ vững phong độ nhé, đừng để đứt chuỗi công việc!'
        : 'Hoàn thành các công việc đúng hạn để bắt đầu chuỗi mới';

  return (
    <section className={`streak${alive ? ' streak--alive' : ''}`} aria-label="Chuỗi ngày đúng hẹn">
      <div className="streak__main">
        <span className="streak__flame">
          <Icon name="flame" />
        </span>

        <div className="streak__text">
          <p className="streak__count">
            <strong>{shown}</strong>
            <span>ngày liên tiếp đúng hạn</span>
            {alive && current >= 3 && (
              <span className="streak__badge">
                <Icon name="zap" size={13} />
                Phong độ cao
              </span>
            )}
          </p>
          <p className="streak__caption">{caption}</p>
        </div>
      </div>

      <ol className="streak__week">
        {week.map((d) => (
          <li
            key={d.key}
            className={`streak__day streak__day--${d.state}${d.isToday ? ' streak__day--today' : ''}`}
            title={`${d.label} (ngày ${d.date}): ${DAY_TOOLTIP[d.state]}${d.isToday ? ' - Hôm nay' : ''}`}
          >
            <span className="streak__mark">
              <Icon name={DAY_ICON[d.state]} />
            </span>
            <small>{d.label}</small>
          </li>
        ))}
      </ol>

      <div className="streak__best">
        <span className="streak__best-icon">
          <Icon name="award" size={16} />
        </span>
        <strong>{best}</strong>
        <small>kỷ lục ngày</small>
      </div>
    </section>
  );
}
