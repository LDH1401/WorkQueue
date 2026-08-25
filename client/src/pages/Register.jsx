import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
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
      <div className="auth__card">
        <div className="brand brand--center">
          <span className="brand__logo">WQ</span>
          <div>
            <strong>WorkQueue</strong>
            <small>Quản lý công việc</small>
          </div>
        </div>

        <h1>Tạo tài khoản</h1>
        <p className="muted">Chỉ mất chưa đến một phút để bắt đầu.</p>

        <form onSubmit={submit} className="form">
          {error && <div className="alert alert--error">{error}</div>}

          <label className="field">
            <span>Họ và tên</span>
            <input value={form.name} onChange={setField('name')} placeholder="Nguyễn Văn A" required />
          </label>

          <label className="field">
            <span>Email</span>
            <input type="email" value={form.email} onChange={setField('email')} placeholder="ban@congty.com" required />
          </label>

          <div className="grid-2">
            <label className="field">
              <span>Mật khẩu</span>
              <input type="password" value={form.password} onChange={setField('password')} placeholder="Tối thiểu 6 ký tự" required />
            </label>

            <label className="field">
              <span>Xác nhận mật khẩu</span>
              <input type="password" value={form.confirm} onChange={setField('confirm')} placeholder="Nhập lại mật khẩu" required />
            </label>
          </div>

          <button type="submit" className="btn btn--primary btn--block" disabled={loading}>
            {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
          </button>
        </form>

        <p className="auth__foot">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
