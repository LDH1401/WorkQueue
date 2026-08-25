import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import AuthAside from '../components/AuthAside';
import Icon from '../components/icons';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const setField = (name) => (e) => setForm({ ...form, [name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return setError('Mật khẩu tối thiểu 6 ký tự');
    if (form.password !== form.confirm) return setError('Mật khẩu xác nhận không khớp');

    setLoading(true);
    setError('');
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      navigate('/', { replace: true });
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
          <div className="auth__header">
            <h1>Tạo tài khoản mới</h1>
            <p className="muted">Chỉ mất chưa đến một phút để bắt đầu quản lý công việc.</p>
          </div>

          <form onSubmit={submit} className="form">
            {error && (
              <div className="alert alert--error">
                <Icon name="alert" />
                <span>{error}</span>
              </div>
            )}

            <label className="field">
              <span>Họ và tên *</span>
              <input
                value={form.name}
                onChange={setField('name')}
                placeholder="Ví dụ: Nguyễn Văn An"
                required
                autoFocus
              />
            </label>

            <label className="field">
              <span>Email *</span>
              <input
                type="email"
                value={form.email}
                onChange={setField('email')}
                placeholder="ban@congty.com"
                autoComplete="email"
                required
              />
            </label>

            <div className="grid-2">
              <label className="field">
                <span>Mật khẩu *</span>
                <div className="input-with-action">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={setField('password')}
                    placeholder="≥ 6 ký tự"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="input-action-btn"
                    onClick={() => setShowPassword((v) => !v)}
                    title={showPassword ? 'Ẩn' : 'Hiện'}
                    aria-label="Hiển thị mật khẩu"
                  >
                    <Icon name={showPassword ? 'eyeOff' : 'eye'} size={15} />
                  </button>
                </div>
              </label>

              <label className="field">
                <span>Xác nhận mật khẩu *</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.confirm}
                  onChange={setField('confirm')}
                  placeholder="Nhập lại mật khẩu"
                  autoComplete="new-password"
                  required
                />
              </label>
            </div>

            <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner spinner--sm" />
                  Đang tạo tài khoản...
                </>
              ) : (
                'Tạo tài khoản'
              )}
            </button>
          </form>

          <p className="auth__foot">
            Đã có tài khoản? <Link to="/login" className="link-highlight">Đăng nhập ngay</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
