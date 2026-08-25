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
  const [showPassword, setShowPassword] = useState(false);
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

  const fillDemo = () => {
    setForm({ email: 'demo@workqueue.dev', password: '123456' });
    setError('');
  };

  return (
    <div className="auth">
      <AuthAside />

      <div className="auth__panel">
        <div className="auth__card">
          <div className="auth__header">
            <h1>Đăng nhập</h1>
            <p className="muted">Chào mừng bạn quay lại! Nhập thông tin để tiếp tục.</p>
          </div>

          <form onSubmit={submit} className="form">
            {error && (
              <div className="alert alert--error">
                <Icon name="alert" />
                <span>{error}</span>
              </div>
            )}

            <label className="field">
              <span>Email tài khoản</span>
              <div className="input-with-icon">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="ban@congty.com"
                  autoComplete="email"
                  required
                />
              </div>
            </label>

            <label className="field">
              <span>Mật khẩu</span>
              <div className="input-with-action">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="input-action-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  aria-label="Hiển thị mật khẩu"
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} size={16} />
                </button>
              </div>
            </label>

            <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner spinner--sm" />
                  Đang đăng nhập...
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>

          <div className="auth__divider">
            <span>hoặc trải nghiệm nhanh</span>
          </div>

          <button type="button" className="btn btn--ghost btn--block btn--demo" onClick={fillDemo}>
            <Icon name="zap" size={15} />
            Điền tài khoản Demo
          </button>

          <p className="auth__foot">
            Chưa có tài khoản? <Link to="/register" className="link-highlight">Đăng ký ngay</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
