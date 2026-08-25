import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Gắn token vào mọi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('wq_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Chuẩn hoá thông báo lỗi + tự đăng xuất khi token hết hạn
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Có lỗi xảy ra, vui lòng thử lại';

    if (error.response?.status === 401 && localStorage.getItem('wq_token')) {
      localStorage.removeItem('wq_token');
      if (!location.pathname.startsWith('/login')) location.href = '/login';
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
