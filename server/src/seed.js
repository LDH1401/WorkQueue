import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Project from './models/Project.js';
import Task from './models/Task.js';

/** Hạn chót cuối ngày (mặc định) hoặc đúng giờ phút chỉ định */
const days = (n, h = 23, m = 59) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(h, m, 0, 0);
  return d;
};

async function seed() {
  await connectDB(process.env.MONGO_URI);

  console.log('→ Xoá dữ liệu cũ...');
  await Promise.all([User.deleteMany({}), Project.deleteMany({}), Task.deleteMany({})]);

  console.log('→ Tạo tài khoản...');
  const me = await User.create({
    name: 'Nguyễn Văn An',
    email: 'demo@workqueue.dev',
    password: '123456',
    avatarColor: '#6366f1',
  });

  console.log('→ Tạo dự án...');
  const [web, app] = await Project.create([
    {
      name: 'Website bán hàng',
      description: 'Xây dựng website thương mại điện tử cho khách hàng ABC',
      color: '#6366f1',
      owner: me._id,
    },
    {
      name: 'Học tiếng Anh',
      description: 'Mục tiêu IELTS 7.0 trong 6 tháng',
      color: '#f59e0b',
      owner: me._id,
    },
  ]);

  console.log('→ Tạo công việc...');
  const tasks = [
    { title: 'Thiết kế giao diện trang chủ', status: 'done', priority: 'high', project: web._id, tags: ['design', 'ui'], dueDate: days(-5), completedAt: days(-4) },
    { title: 'Dựng API danh mục sản phẩm', status: 'done', priority: 'medium', project: web._id, tags: ['backend'], dueDate: days(-2), completedAt: days(-1) },
    { title: 'Tích hợp cổng thanh toán VNPay', status: 'in_progress', priority: 'urgent', project: web._id, tags: ['backend', 'payment'], dueDate: days(2) },
    { title: 'Viết trang giỏ hàng', status: 'in_progress', priority: 'high', project: web._id, tags: ['frontend'], dueDate: days(3) },
    { title: 'Tối ưu tốc độ tải trang', status: 'todo', priority: 'medium', project: web._id, tags: ['performance'], dueDate: days(7) },
    { title: 'Kiểm thử luồng đặt hàng', status: 'in_progress', priority: 'high', project: web._id, tags: ['qa'], dueDate: days(1, 9, 30) },
    { title: 'Sửa lỗi hiển thị trên Safari', status: 'todo', priority: 'low', project: web._id, tags: ['bug'], dueDate: days(-1) },
    { title: 'Học 30 từ vựng chủ đề Environment', status: 'done', priority: 'medium', project: app._id, tags: ['vocabulary'], dueDate: days(-3), completedAt: days(-3) },
    { title: 'Luyện Writing Task 2 – đề Technology', status: 'todo', priority: 'high', project: app._id, tags: ['writing'], dueDate: days(5) },
    { title: 'Nghe podcast BBC 6 Minute English', status: 'in_progress', priority: 'medium', project: app._id, tags: ['listening'], dueDate: days(4, 7, 0) },
    { title: 'Đóng tiền điện nước', status: 'todo', priority: 'low', project: null, tags: ['cá-nhân'], dueDate: days(10) },
    { title: 'Đặt lịch khám sức khoẻ định kỳ', status: 'todo', priority: 'urgent', project: null, tags: ['sức-khoẻ'], dueDate: days(0, 16, 45) },
  ];

  await Task.create(
    tasks.map((t, i) => ({
      ...t,
      description: 'Công việc mẫu được tạo bởi script seed để bạn xem thử giao diện.',
      createdBy: me._id,
      order: i,
    }))
  );

  console.log('\n✔ Đã tạo dữ liệu mẫu thành công!');
  console.log('  Đăng nhập: demo@workqueue.dev / 123456\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('✖ Seed thất bại:', err);
  process.exit(1);
});
