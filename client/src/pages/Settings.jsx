import { useState } from 'react';
import api from '../api/client';
import { Avatar } from '../components/ui';
import { PROJECT_COLORS } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState({ name: user.name, avatarColor: user.avatarColor });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.patch('/auth/me', profile);
      updateUser(data.user);
      toast.success('Đã cập nhật thông tin cá nhân');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirm) return toast.error('Mật khẩu xác nhận không khớp');

    setSavingPassword(true);
    try {
      await api.patch('/auth/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' });
      toast.success('Đã đổi mật khẩu');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Tài khoản</h1>
          <p className="muted">Cập nhật thông tin cá nhân và bảo mật.</p>
        </div>
      </header>

      <div className="two-col">
        <section className="card">
          <div className="card__head"><h2>Thông tin cá nhân</h2></div>

          <div className="profile-preview">
            <Avatar user={{ ...user, ...profile }} size={64} />
            <div>
              <strong>{profile.name}</strong>
              <span className="muted-sm">{user.email}</span>
            </div>
          </div>

          <form onSubmit={saveProfile} className="form">
            <label className="field">
              <span>Họ và tên</span>
              <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            </label>

            <div className="field">
              <span>Màu ảnh đại diện</span>
              <div className="color-picker">
                {PROJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`swatch${profile.avatarColor === color ? ' swatch--active' : ''}`}
                    style={{ background: color }}
                    onClick={() => setProfile({ ...profile, avatarColor: color })}
                    aria-label={`Chọn màu ${color}`}
                  />
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn--primary" disabled={savingProfile}>
              {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </form>
        </section>

        <section className="card">
          <div className="card__head"><h2>Đổi mật khẩu</h2></div>

          <form onSubmit={savePassword} className="form">
            <label className="field">
              <span>Mật khẩu hiện tại</span>
              <input
                type="password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                required
              />
            </label>

            <label className="field">
              <span>Mật khẩu mới</span>
              <input
                type="password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                minLength={6}
                required
              />
            </label>

            <label className="field">
              <span>Xác nhận mật khẩu mới</span>
              <input
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                required
              />
            </label>

            <button type="submit" className="btn btn--primary" disabled={savingPassword}>
              {savingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
