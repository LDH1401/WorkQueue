/**
 * Điểm vào cho Vercel Serverless Function.
 *
 * Mọi request tới /api/... đều rơi vào file này (nhờ tên file catch-all [...path]),
 * rồi được chuyển thẳng cho app Express dùng chung với bản chạy local.
 * Khác biệt duy nhất so với server/src/server.js: ở đây KHÔNG gọi app.listen(),
 * vì Vercel tự quản lý vòng đời tiến trình.
 */
import 'dotenv/config';
import app from '../server/src/app.js';
import { connectDB } from '../server/src/config/db.js';

export default async function handler(req, res) {
  try {
    await connectDB(process.env.MONGO_URI);
  } catch (err) {
    console.error('Không kết nối được MongoDB:', err.message);
    return res.status(503).json({
      success: false,
      message: 'Không kết nối được cơ sở dữ liệu, vui lòng thử lại sau',
    });
  }

  return app(req, res);
}
