import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form.email, form.password);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => setForm({ email: 'demo@workqueue.dev', password: '123456' });

  return (
    <div className="auth">
      <div className="auth__card">
        <div className="brand brand--center">
          <span className="brand__logo">WQ</span>
          <div>
            <strong>WorkQueue</strong>
            <small>Quản lý công việc</small>
          </div>
        </div>

        <h1>Đăng nhập</h1>
        <p className="muted">Chào mừng bạn quay lại! Nhập thông tin để tiếp tục.</p>

        <form onSubmit={submit} className="form">
          {error && <div className="alert alert--error">{error}</div>}

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="ban@congty.com"
              required
            />
          </label>

          <label className="field">
            <span>Mật khẩu</span>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </label>

          <button type="submit" className="btn btn--primary btn--block" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <button type="button" className="btn btn--ghost btn--block" onClick={fillDemo}>
          Điền tài khoản demo
        </button>

        <p className="auth__foot">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}
