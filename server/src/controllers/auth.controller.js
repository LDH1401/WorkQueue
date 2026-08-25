import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';

function signToken(user) {
  return jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

export const register = asyncHandler(async (req, res) => {
  // Ứng dụng cá nhân: sau khi tạo xong tài khoản của mình, đặt
  // ALLOW_REGISTRATION=false để người lạ không đăng ký được nữa.
  if (process.env.ALLOW_REGISTRATION === 'false') {
    throw new ApiError(403, 'Ứng dụng này chỉ dành cho cá nhân, đã tắt đăng ký tài khoản mới');
  }

  const { name, email, password } = req.body;
  if (!name || !email || !password) throw new ApiError(400, 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu');

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw new ApiError(409, 'Email này đã được đăng ký');

  const user = await User.create({ name, email, password });
  res.status(201).json({ success: true, token: signToken(user), user });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Vui lòng nhập email và mật khẩu');

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Email hoặc mật khẩu không đúng');
  }

  res.json({ success: true, token: signToken(user), user });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, avatarColor } = req.body;
  if (name !== undefined) req.user.name = name;
  if (avatarColor !== undefined) req.user.avatarColor = avatarColor;
  await req.user.save();
  res.json({ success: true, user: req.user });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new ApiError(400, 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới');
  if (newPassword.length < 6) throw new ApiError(400, 'Mật khẩu mới tối thiểu 6 ký tự');

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) throw new ApiError(401, 'Mật khẩu hiện tại không đúng');

  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Đổi mật khẩu thành công' });
});
