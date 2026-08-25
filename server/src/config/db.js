import mongoose from 'mongoose';

export async function connectDB(uri) {
  if (!uri) throw new Error('Thiếu biến môi trường MONGO_URI');

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });

  const { host, name } = mongoose.connection;
  console.log(`✔ MongoDB đã kết nối: ${host}/${name}`);

  mongoose.connection.on('error', (err) => console.error('MongoDB error:', err.message));
  mongoose.connection.on('disconnected', () => console.warn('MongoDB mất kết nối'));
}
