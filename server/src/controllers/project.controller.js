import Project from '../models/Project.js';
import Task from '../models/Task.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { projectAccessFilter } from '../utils/access.js';

const POPULATE = [
  { path: 'owner', select: 'name email avatarColor' },
  { path: 'members', select: 'name email avatarColor' },
];

export const listProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({ ...projectAccessFilter(req.user._id), archived: false })
    .populate(POPULATE)
    .sort('-createdAt')
    .lean();

  // Đính kèm số liệu công việc của từng dự án
  const counts = await Task.aggregate([
    { $match: { project: { $in: projects.map((p) => p._id) } } },
    { $group: { _id: { project: '$project', status: '$status' }, count: { $sum: 1 } } },
  ]);

  const stats = {};
  for (const row of counts) {
    const id = row._id.project.toString();
    stats[id] ??= { total: 0, done: 0 };
    stats[id].total += row.count;
    if (row._id.status === 'done') stats[id].done += row.count;
  }

  res.json({
    success: true,
    projects: projects.map((p) => ({ ...p, stats: stats[p._id.toString()] || { total: 0, done: 0 } })),
  });
});

export const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, ...projectAccessFilter(req.user._id) }).populate(POPULATE);
  if (!project) throw new ApiError(404, 'Không tìm thấy dự án');
  res.json({ success: true, project });
});

export const createProject = asyncHandler(async (req, res) => {
  const { name, description, color, members = [] } = req.body;
  const project = await Project.create({
    name,
    description,
    color,
    owner: req.user._id,
    members: [...new Set([...members.map(String), req.user._id.toString()])],
  });
  res.status(201).json({ success: true, project: await project.populate(POPULATE) });
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, ...projectAccessFilter(req.user._id) });
  if (!project) throw new ApiError(404, 'Không tìm thấy dự án');

  for (const field of ['name', 'description', 'color', 'members', 'archived']) {
    if (req.body[field] !== undefined) project[field] = req.body[field];
  }
  await project.save();
  res.json({ success: true, project: await project.populate(POPULATE) });
});

export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, owner: req.user._id });
  if (!project) throw new ApiError(404, 'Không tìm thấy dự án (chỉ chủ dự án mới được xoá)');

  // Gỡ dự án khỏi các công việc thay vì xoá luôn công việc
  await Task.updateMany({ project: project._id }, { $set: { project: null } });
  await project.deleteOne();

  res.json({ success: true, message: 'Đã xoá dự án' });
});
