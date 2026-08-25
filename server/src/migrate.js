/**
 * Chuyển dữ liệu cũ sang cấu trúc hiện tại.
 * Chạy một lần sau khi cập nhật code: npm run migrate
 *
 * KHÁC với seed: script này KHÔNG xoá gì cả, chỉ sửa những bản ghi lỗi thời.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import Task, { TASK_STATUSES } from './models/Task.js';

async function migrate() {
  await connectDB(process.env.MONGO_URI);

  // Trạng thái 'review' (Chờ duyệt) đã bị bỏ -> đưa về 'in_progress'
  const orphans = await Task.countDocuments({ status: { $nin: TASK_STATUSES } });

  if (orphans === 0) {
    console.log('✔ Không có công việc nào cần chuyển đổi.');
  } else {
    const result = await Task.updateMany(
      { status: { $nin: TASK_STATUSES } },
      { $set: { status: 'in_progress' } }
    );
    console.log(`✔ Đã chuyển ${result.modifiedCount} công việc sang trạng thái "Đang làm".`);
  }

  // Gỡ các trường của bản nhiều người dùng.
  // Phải dùng driver native: Mongoose ở chế độ strict sẽ loại bỏ khỏi câu update
  // những field không còn tồn tại trong schema, khiến $unset không có tác dụng.
  const cleaned = await Task.collection.updateMany(
    { $or: [{ assignee: { $exists: true } }, { 'comments.author': { $exists: true } }] },
    { $unset: { assignee: '', 'comments.$[].author': '' } }
  );
  console.log(
    cleaned.modifiedCount
      ? `✔ Đã gỡ trường cũ (assignee, tác giả ghi chú) khỏi ${cleaned.modifiedCount} công việc.`
      : '✔ Không có trường cũ nào cần gỡ.'
  );

  const projects = await mongoose.connection.collection('projects').updateMany(
    { members: { $exists: true } },
    { $unset: { members: '' } }
  );
  if (projects.modifiedCount) console.log(`✔ Đã gỡ danh sách thành viên khỏi ${projects.modifiedCount} dự án.`);

  // Dọn hẳn những việc đã xoá quá 30 ngày
  const cutoff = new Date(Date.now() - 30 * 864e5);
  const purged = await Task.deleteMany({ deletedAt: { $ne: null, $lt: cutoff } });
  if (purged.deletedCount) console.log(`✔ Đã dọn vĩnh viễn ${purged.deletedCount} công việc trong thùng rác quá 30 ngày.`);

  await mongoose.disconnect();
  console.log('\nXong.\n');
}

migrate().catch((err) => {
  console.error('✖ Chuyển đổi thất bại:', err);
  process.exit(1);
});
