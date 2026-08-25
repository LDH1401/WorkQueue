import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vui lòng nhập tên dự án'],
      trim: true,
      maxlength: [120, 'Tên dự án tối đa 120 ký tự'],
    },
    description: { type: String, trim: true, default: '', maxlength: 2000 },
    color: { type: String, default: '#10b981' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Project', projectSchema);
