import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import AuthAside from '../components/AuthAside';
import Icon from '../components/icons';
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

  return (
    <div className="auth">
      <AuthAside />

      <div className="auth__panel">
        <div className="auth__card">
          <h1>Đăng nhập</h1>
          <p className="muted">Chào mừng bạn quay lại! Nhập thông tin để tiếp tục.</p>

          <form onSubmit={submit} className="form">
            {error && (
              <div className="alert alert--error">
                <Icon name="alert" />
                {error}
              </div>
            )}

            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="ban@congty.com"
                autoComplete="email"
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
                autoComplete="current-password"
                required
              />
            </label>

            <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={loading}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <div className="auth__divider">hoặc</div>

          <button
            type="button"
            className="btn btn--ghost btn--block"
            onClick={() => setForm({ email: 'demo@workqueue.dev', password: '123456' })}
          >
            Điền tài khoản demo
          </button>

          <p className="auth__foot">
            Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
