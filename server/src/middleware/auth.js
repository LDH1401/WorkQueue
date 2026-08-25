import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

export async function protect(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new ApiError(401, 'Bạn cần đăng nhập để thực hiện thao tác này');

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      throw new ApiError(401, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn');
    }

    const user = await User.findById(payload.sub);
    if (!user) throw new ApiError(401, 'Tài khoản không còn tồn tại');

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
