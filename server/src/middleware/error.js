import { ApiError } from '../utils/ApiError.js';

export function notFound(req, _res, next) {
  next(new ApiError(404, `Không tìm thấy endpoint: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Lỗi máy chủ';
  let details;

  if (err.name === 'ValidationError') {
    status = 400;
    details = Object.values(err.errors).map((e) => e.message);
    message = details[0];
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Giá trị không hợp lệ cho trường "${err.path}"`;
  } else if (err.code === 11000) {
    status = 409;
    message = `Giá trị "${Object.values(err.keyValue)[0]}" đã tồn tại`;
  }

  if (status >= 500) console.error(err);

  res.status(status).json({ success: false, message, ...(details && { details }) });
}
