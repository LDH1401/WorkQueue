import Icon from './icons';
import { useCountUp } from './ui';

const DAY_ICON = { hit: 'flame', miss: 'x', clean: 'check' };

/** Dải streak nổi bật ở đầu trang Tổng quan */
export default function StreakBanner({ streak }) {
  const { current, best, hasData, brokenToday, week } = streak;
  const shown = useCountUp(current);
  const alive = current > 0;

  const caption = !hasData
    ? 'Đặt hạn chót cho công việc để bắt đầu tính chuỗi'
    : brokenToday
      ? 'Hôm nay có việc trễ hạn — mai làm lại nhé'
      : alive
        ? current >= best
          ? 'Bạn đang ở mức kỷ lục của chính mình!'
          : 'Giữ nhịp này nhé, đừng để đứt chuỗi'
        : 'Hoàn thành việc đúng hạn để bắt đầu chuỗi mới';

  return (
    <section className={`streak${alive ? ' streak--alive' : ''}`} aria-label="Chuỗi ngày đúng hẹn">
      <div className="streak__main">
        <span className="streak__flame">
          <Icon name="flame" />
        </span>

        <div className="streak__text">
          <p className="streak__count">
            <strong>{shown}</strong>
            <span>ngày liên tiếp đúng hẹn</span>
          </p>
          <p className="streak__caption">{caption}</p>
        </div>
      </div>

      <ol className="streak__week">
        {week.map((d) => (
          <li
            key={d.key}
            className={`streak__day streak__day--${d.state}${d.isToday ? ' streak__day--today' : ''}`}
          >
            <span className="streak__mark">
              <Icon name={DAY_ICON[d.state]} />
            </span>
            <small>{d.label}</small>
          </li>
        ))}
      </ol>

      <div className="streak__best">
        <strong>{best}</strong>
        <small>kỷ lục</small>
      </div>
    </section>
  );
}
