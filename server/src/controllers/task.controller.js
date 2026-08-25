import mongoose from 'mongoose';
import Task, { TASK_STATUSES, TASK_PRIORITIES } from '../models/Task.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { taskAccessFilter } from '../utils/access.js';

const POPULATE = [
  { path: 'assignee', select: 'name email avatarColor' },
  { path: 'createdBy', select: 'name email avatarColor' },
  { path: 'project', select: 'name color' },
  { path: 'comments.author', select: 'name email avatarColor' },
];

const SORTABLE = {
  createdAt: '-createdAt',
  oldest: 'createdAt',
  dueDate: 'dueDate',
  priority: '-priority',
  title: 'title',
  order: 'order',
};

/** Ghép filter quyền truy cập với các tham số lọc trên query string */
async function buildQuery(req) {
  const filter = { $and: [await taskAccessFilter(req.user._id)] };
  const { status, priority, project, assignee, tag, q, due } = req.query;

  if (status && TASK_STATUSES.includes(status)) filter.$and.push({ status });
  if (priority && TASK_PRIORITIES.includes(priority)) filter.$and.push({ priority });
  if (project) filter.$and.push({ project: project === 'none' ? null : project });
  if (assignee) filter.$and.push({ assignee: assignee === 'me' ? req.user._id : assignee === 'none' ? null : assignee });
  if (tag) filter.$and.push({ tags: tag.toLowerCase() });

  if (q) {
    const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$and.push({ $or: [{ title: rx }, { description: rx }, { tags: rx }] });
  }

  const now = new Date();
  if (due === 'overdue') filter.$and.push({ dueDate: { $lt: now }, status: { $ne: 'done' } });
  if (due === 'today') {
    const start = new Date(now).setHours(0, 0, 0, 0);
    const end = new Date(now).setHours(23, 59, 59, 999);
    filter.$and.push({ dueDate: { $gte: new Date(start), $lte: new Date(end) } });
  }
  if (due === 'week') {
    filter.$and.push({ dueDate: { $gte: now, $lte: new Date(now.getTime() + 7 * 864e5) } });
  }

  return filter;
}

export const listTasks = asyncHandler(async (req, res) => {
  const filter = await buildQuery(req);
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const sort = SORTABLE[req.query.sort] || SORTABLE.createdAt;

  const [items, total] = await Promise.all([
    Task.find(filter).populate(POPULATE).sort(sort).skip((page - 1) * limit).limit(limit),
    Task.countDocuments(filter),
  ]);

  res.json({ success: true, items, total, page, pages: Math.ceil(total / limit) || 1 });
});

/** Toàn bộ công việc gom theo cột, phục vụ màn hình Kanban */
export const boardTasks = asyncHandler(async (req, res) => {
  const filter = await buildQuery(req);
  const tasks = await Task.find(filter).populate(POPULATE).sort({ order: 1, createdAt: -1 }).limit(500);

  const columns = Object.fromEntries(TASK_STATUSES.map((s) => [s, []]));
  for (const task of tasks) columns[task.status].push(task);

  res.json({ success: true, columns });
});

export const getTask = asyncHandler(async (req, res) => {
  const filter = await taskAccessFilter(req.user._id);
  const task = await Task.findOne({ $and: [{ _id: req.params.id }, filter] }).populate(POPULATE);
  if (!task) throw new ApiError(404, 'Không tìm thấy công việc');
  res.json({ success: true, task });
});

export const createTask = asyncHandler(async (req, res) => {
  const { title, description, status, priority, dueDate, tags, project, assignee } = req.body;
  if (!title?.trim()) throw new ApiError(400, 'Vui lòng nhập tiêu đề công việc');

  const first = await Task.findOne({ status: status || 'todo' }).sort('order').select('order').lean();

  const task = await Task.create({
    title,
    description,
    status,
    priority,
    dueDate: dueDate || null,
    tags: Array.isArray(tags) ? tags : [],
    project: project || null,
    assignee: assignee || null,
    createdBy: req.user._id,
    order: (first?.order ?? 0) - 1,
  });

  res.status(201).json({ success: true, task: await task.populate(POPULATE) });
});

export const updateTask = asyncHandler(async (req, res) => {
  const filter = await taskAccessFilter(req.user._id);
  const task = await Task.findOne({ $and: [{ _id: req.params.id }, filter] });
  if (!task) throw new ApiError(404, 'Không tìm thấy công việc');

  const fields = ['title', 'description', 'status', 'priority', 'tags', 'order'];
  for (const field of fields) {
    if (req.body[field] !== undefined) task[field] = req.body[field];
  }
  if (req.body.dueDate !== undefined) task.dueDate = req.body.dueDate || null;
  if (req.body.project !== undefined) task.project = req.body.project || null;
  if (req.body.assignee !== undefined) task.assignee = req.body.assignee || null;

  await task.save();
  res.json({ success: true, task: await task.populate(POPULATE) });
});

/** Kéo - thả trên bảng Kanban: đổi cột và vị trí trong cột */
export const moveTask = asyncHandler(async (req, res) => {
  const { status, index = 0 } = req.body;
  if (!TASK_STATUSES.includes(status)) throw new ApiError(400, 'Trạng thái không hợp lệ');

  const access = await taskAccessFilter(req.user._id);
  const task = await Task.findOne({ $and: [{ _id: req.params.id }, access] });
  if (!task) throw new ApiError(404, 'Không tìm thấy công việc');

  task.status = status;
  await task.save();

  // Đánh lại thứ tự cả cột đích để giữ vị trí ổn định
  const column = await Task.find({ $and: [{ status }, access] }).sort({ order: 1, createdAt: -1 }).select('_id');
  const ids = column.map((t) => t._id.toString()).filter((id) => id !== task._id.toString());
  ids.splice(Math.min(Math.max(0, Number(index)), ids.length), 0, task._id.toString());

  await Task.bulkWrite(
    ids.map((id, i) => ({
      updateOne: { filter: { _id: new mongoose.Types.ObjectId(id) }, update: { $set: { order: i } } },
    }))
  );

  // Đọc lại để trả về giá trị order mới nhất sau khi đánh lại thứ tự
  res.json({ success: true, task: await Task.findById(task._id).populate(POPULATE) });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const filter = await taskAccessFilter(req.user._id);
  const task = await Task.findOneAndDelete({ $and: [{ _id: req.params.id }, filter] });
  if (!task) throw new ApiError(404, 'Không tìm thấy công việc');
  res.json({ success: true, message: 'Đã xoá công việc' });
});

export const addComment = asyncHandler(async (req, res) => {
  const { body } = req.body;
  if (!body?.trim()) throw new ApiError(400, 'Nội dung bình luận không được để trống');

  const filter = await taskAccessFilter(req.user._id);
  const task = await Task.findOne({ $and: [{ _id: req.params.id }, filter] });
  if (!task) throw new ApiError(404, 'Không tìm thấy công việc');

  task.comments.push({ author: req.user._id, body });
  await task.save();
  res.status(201).json({ success: true, task: await task.populate(POPULATE) });
});

export const deleteComment = asyncHandler(async (req, res) => {
  const filter = await taskAccessFilter(req.user._id);
  const task = await Task.findOne({ $and: [{ _id: req.params.id }, filter] });
  if (!task) throw new ApiError(404, 'Không tìm thấy công việc');

  const comment = task.comments.id(req.params.commentId);
  if (!comment) throw new ApiError(404, 'Không tìm thấy bình luận');
  if (comment.author.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Bạn chỉ có thể xoá bình luận của mình');
  }

  comment.deleteOne();
  await task.save();
  res.json({ success: true, task: await task.populate(POPULATE) });
});

/** Số liệu tổng quan cho dashboard */
export const taskStats = asyncHandler(async (req, res) => {
  const access = await taskAccessFilter(req.user._id);
  const now = new Date();
  const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
  const weekAgo = new Date(now.getTime() - 7 * 864e5);

  const [byStatus, byPriority, overdue, dueToday, completedThisWeek, assignedToMe, upcoming] = await Promise.all([
    Task.aggregate([{ $match: access }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Task.aggregate([{ $match: access }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
    Task.countDocuments({ $and: [access, { dueDate: { $lt: now }, status: { $ne: 'done' } }] }),
    Task.countDocuments({
      $and: [access, { dueDate: { $gte: startOfToday, $lt: new Date(startOfToday.getTime() + 864e5) } }],
    }),
    Task.countDocuments({ $and: [access, { status: 'done', completedAt: { $gte: weekAgo } }] }),
    Task.countDocuments({ $and: [access, { assignee: req.user._id, status: { $ne: 'done' } }] }),
    Task.find({ $and: [access, { dueDate: { $gte: now }, status: { $ne: 'done' } }] })
      .populate(POPULATE)
      .sort('dueDate')
      .limit(5),
  ]);

  const toMap = (rows, keys) => {
    const map = Object.fromEntries(keys.map((k) => [k, 0]));
    for (const r of rows) map[r._id] = r.count;
    return map;
  };

  const status = toMap(byStatus, TASK_STATUSES);
  const total = Object.values(status).reduce((a, b) => a + b, 0);

  res.json({
    success: true,
    stats: {
      total,
      status,
      priority: toMap(byPriority, TASK_PRIORITIES),
      overdue,
      dueToday,
      completedThisWeek,
      assignedToMe,
      completionRate: total ? Math.round((status.done / total) * 100) : 0,
      upcoming,
    },
  });
});
