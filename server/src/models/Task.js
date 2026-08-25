import mongoose from 'mongoose';

export const TASK_STATUSES = ['todo', 'in_progress', 'review', 'done'];
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const commentSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Vui lòng nhập tiêu đề công việc'],
      trim: true,
      maxlength: [200, 'Tiêu đề tối đa 200 ký tự'],
    },
    description: { type: String, trim: true, default: '', maxlength: 5000 },
    status: { type: String, enum: TASK_STATUSES, default: 'todo', index: true },
    priority: { type: String, enum: TASK_PRIORITIES, default: 'medium', index: true },
    dueDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    tags: [{ type: String, trim: true, lowercase: true, maxlength: 30 }],
    order: { type: Number, default: 0 },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null, index: true },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    comments: [commentSchema],
  },
  { timestamps: true }
);

// Hỗ trợ tìm kiếm theo tiêu đề / mô tả
taskSchema.index({ title: 'text', description: 'text' });

// Tự động gắn/xoá mốc hoàn thành khi đổi trạng thái
taskSchema.pre('save', function syncCompletedAt(next) {
  if (this.isModified('status')) {
    this.completedAt = this.status === 'done' ? this.completedAt || new Date() : null;
  }
  next();
});

taskSchema.virtual('isOverdue').get(function isOverdue() {
  return Boolean(this.dueDate && this.status !== 'done' && this.dueDate < new Date());
});

taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

export default mongoose.model('Task', taskSchema);
