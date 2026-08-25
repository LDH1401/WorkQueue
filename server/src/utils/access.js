import Project from '../models/Project.js';

/**
 * Bộ lọc quyền xem công việc: người tạo, người được giao,
 * hoặc bất kỳ công việc nào thuộc dự án mà user là chủ / thành viên.
 */
export async function taskAccessFilter(userId) {
  const projectIds = await Project.find({
    $or: [{ owner: userId }, { members: userId }],
  }).distinct('_id');

  return {
    $or: [{ createdBy: userId }, { assignee: userId }, { project: { $in: projectIds } }],
  };
}

/** Bộ lọc quyền xem dự án */
export function projectAccessFilter(userId) {
  return { $or: [{ owner: userId }, { members: userId }] };
}
