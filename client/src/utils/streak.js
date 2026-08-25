/**
 * Chuỗi ngày liên tiếp không để lỡ deadline nào.
 *
 * Tính ở phía trình duyệt để dùng đúng múi giờ của người dùng — server có thể
 * chạy ở UTC, khi đó deadline lúc 6h sáng giờ VN sẽ bị quy về ngày hôm trước.
 *
 * Một ngày bị "đứt" nếu có deadline rơi vào ngày đó mà không hoàn thành kịp.
 * Ngày không có deadline nào vẫn tính là đúng hẹn.
 *
 * Trả về cả dải 7 ngày gần nhất để vẽ lịch tuần kiểu Duolingo.
 *
 * @param {{ due: string, met: boolean }[]} deadlines - các mốc hạn đã qua
 */
const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export function computeStreak(deadlines = []) {
  const startOfDay = (value) => {
    const d = new Date(value);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  /** Dải 7 ngày gần nhất, cũ -> mới */
  const buildWeek = (broken, seen, todayStart) => {
    const days = [];
    const cursor = new Date(todayStart);
    cursor.setDate(cursor.getDate() - 6);

    for (let i = 0; i < 7; i += 1) {
      const key = cursor.getTime();
      days.push({
        key,
        label: WEEKDAYS[cursor.getDay()],
        date: cursor.getDate(),
        state: broken.has(key) ? 'miss' : seen.has(key) ? 'hit' : 'clean',
        isToday: key === todayStart,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  };

  const todayKey = startOfDay(new Date());
  if (!deadlines.length) {
    return {
      current: 0,
      best: 0,
      hasData: false,
      brokenToday: false,
      week: buildWeek(new Set(), new Set(), todayKey),
    };
  }

  const broken = new Set();
  const seen = new Set();
  let earliest = Infinity;

  for (const item of deadlines) {
    const key = startOfDay(item.due);
    if (key < earliest) earliest = key;
    seen.add(key);
    if (!item.met) broken.add(key);
  }

  const todayStart = startOfDay(new Date());

  // Đếm ngược từ hôm nay cho tới khi gặp ngày bị đứt
  let current = 0;
  const cursor = new Date(todayStart);
  while (cursor.getTime() >= earliest) {
    if (broken.has(cursor.getTime())) break;
    current += 1;
    cursor.setDate(cursor.getDate() - 1); // setDate thay vì trừ 86400000 để không lệch khi có DST
  }

  // Chuỗi dài nhất trong toàn bộ khoảng dữ liệu
  let best = 0;
  let run = 0;
  const walk = new Date(earliest);
  while (walk.getTime() <= todayStart) {
    if (broken.has(walk.getTime())) run = 0;
    else if (++run > best) best = run;
    walk.setDate(walk.getDate() + 1);
  }

  return {
    current,
    best,
    hasData: true,
    brokenToday: broken.has(todayStart),
    week: buildWeek(broken, seen, todayStart),
  };
}
