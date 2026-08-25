import mongoose from 'mongoose';

/**
 * Trên môi trường serverless (Vercel), file này bị chạy lại mỗi lần cold start.
 * Nếu lần nào cũng gọi mongoose.connect() thì sẽ mở hàng loạt kết nối thừa và
 * chạm trần giới hạn của Atlas. Vì vậy ta cache lại kết nối trên globalThis —
 * chạy server thường (npm start) cũng dùng chung hàm này, chỉ kết nối một lần.
 */
const cache = (globalThis.__workqueueMongo ??= { conn: null, promise: null });

export async function connectDB(uri) {
  if (!uri) throw new Error('Thiếu biến môi trường MONGO_URI');
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    mongoose.set('strictQuery', true);
    mongoose.connection.on('error', (err) => console.error('MongoDB error:', err.message));
    mongoose.connection.on('disconnected', () => console.warn('MongoDB mất kết nối'));

    cache.promise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      maxPoolSize: 10,
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null; // cho phép thử lại ở request sau thay vì hỏng vĩnh viễn
    throw err;
  }

  const { host, name } = mongoose.connection;
  console.log(`✔ MongoDB đã kết nối: ${host}/${name}`);

  return cache.conn;
}
