import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Project from './models/Project.js';
import Task from './models/Task.js';

const days = (n) => new Date(Date.now() + n * 864e5);

async function seed() {
  await connectDB(process.env.MONGO_URI);

  console.log('→ Xoá dữ liệu cũ...');
  await Promise.all([User.deleteMany({}), Project.deleteMany({}), Task.deleteMany({})]);

  console.log('→ Tạo người dùng...');
  const [an, binh, chi] = await User.create([
    { name: 'Nguyễn Văn An', email: 'demo@workqueue.dev', password: '123456', avatarColor: '#6366f1' },
    { name: 'Trần Thị Bình', email: 'binh@workqueue.dev', password: '123456', avatarColor: '#ec4899' },
    { name: 'Lê Minh Chi', email: 'chi@workqueue.dev', password: '123456', avatarColor: '#10b981' },
  ]);

  console.log('→ Tạo dự án...');
  const [web, app] = await Project.create([
    {
      name: 'Website bán hàng',
      description: 'Xây dựng website thương mại điện tử cho khách hàng ABC',
      color: '#6366f1',
      owner: an._id,
      members: [an._id, binh._id, chi._id],
    },
    {
      name: 'Ứng dụng di động',
      description: 'App đặt hàng cho khách hàng thân thiết',
      color: '#f59e0b',
      owner: an._id,
      members: [an._id, chi._id],
    },
  ]);

  console.log('→ Tạo công việc...');
  const tasks = [
    { title: 'Thiết kế giao diện trang chủ', status: 'done', priority: 'high', project: web._id, assignee: binh._id, tags: ['design', 'ui'], dueDate: days(-5), completedAt: days(-4) },
    { title: 'Dựng API danh mục sản phẩm', status: 'done', priority: 'medium', project: web._id, assignee: an._id, tags: ['backend'], dueDate: days(-2), completedAt: days(-1) },
    { title: 'Tích hợp cổng thanh toán VNPay', status: 'in_progress', priority: 'urgent', project: web._id, assignee: an._id, tags: ['backend', 'payment'], dueDate: days(2) },
    { title: 'Viết trang giỏ hàng', status: 'in_progress', priority: 'high', project: web._id, assignee: chi._id, tags: ['frontend'], dueDate: days(3) },
    { title: 'Tối ưu tốc độ tải trang', status: 'todo', priority: 'medium', project: web._id, assignee: chi._id, tags: ['performance'], dueDate: days(7) },
    { title: 'Kiểm thử luồng đặt hàng', status: 'review', priority: 'high', project: web._id, assignee: binh._id, tags: ['qa'], dueDate: days(1) },
    { title: 'Sửa lỗi hiển thị trên Safari', status: 'todo', priority: 'low', project: web._id, assignee: null, tags: ['bug'], dueDate: days(-1) },
    { title: 'Vẽ wireframe màn hình đăng nhập', status: 'done', priority: 'medium', project: app._id, assignee: chi._id, tags: ['design'], dueDate: days(-3), completedAt: days(-3) },
    { title: 'Cấu hình push notification', status: 'todo', priority: 'high', project: app._id, assignee: an._id, tags: ['mobile'], dueDate: days(5) },
    { title: 'Xây dựng màn hình lịch sử đơn hàng', status: 'in_progress', priority: 'medium', project: app._id, assignee: chi._id, tags: ['mobile'], dueDate: days(4) },
    { title: 'Chuẩn bị tài liệu bàn giao', status: 'todo', priority: 'low', project: null, assignee: an._id, tags: ['docs'], dueDate: days(10) },
    { title: 'Họp review sprint với khách hàng', status: 'todo', priority: 'urgent', project: null, assignee: an._id, tags: ['meeting'], dueDate: days(0) },
  ];

  await Task.create(
    tasks.map((t, i) => ({
      ...t,
      description: 'Công việc mẫu được tạo bởi script seed để bạn xem thử giao diện.',
      createdBy: an._id,
      order: i,
    }))
  );

  console.log('\n✔ Đã tạo dữ liệu mẫu thành công!');
  console.log('  Đăng nhập thử: demo@workqueue.dev / 123456\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('✖ Seed thất bại:', err);
  process.exit(1);
});
