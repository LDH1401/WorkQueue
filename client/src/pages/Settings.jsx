import { useState } from 'react';
import api from '../api/client';
import Icon from '../components/icons';
import { Avatar } from '../components/ui';
import { PROJECT_COLORS } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

const THEMES = [
  { value: 'light', icon: 'sun', label: 'Giao diện sáng', desc: 'Tươi sáng, thanh lịch & dễ nhìn ban ngày' },
  { value: 'dark', icon: 'moon', label: 'Giao diện tối', desc: 'Bảo vệ mắt, tương phản cao & hiện đại' },
  { value: 'system', icon: 'monitor', label: 'Theo hệ thống', desc: 'Tự động đồng bộ theo cài đặt hệ điều hành' },
];

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const [profile, setProfile] = useState({ name: user.name, avatarColor: user.avatarColor });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
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
      toast.success('Đã đổi mật khẩu thành công');
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
          <h1>Cài đặt tài khoản</h1>
          <p>Tùy chỉnh thông tin cá nhân, giao diện hiển thị và bảo mật mật khẩu.</p>
        </div>
      </header>

      <div className="two-col">
        <section className="card card--interactive">
          <div className="card__head">
            <div className="card__title-group">
              <Icon name="user" className="card__title-icon" />
              <h2>Thông tin cá nhân</h2>
            </div>
          </div>

          <div className="profile-preview">
            <Avatar user={{ ...user, ...profile }} size={64} showStatus isOnline />
            <div className="profile-preview__info">
              <strong>{profile.name || user.name}</strong>
              <span className="muted-sm">{user.email}</span>
              <span className="pill pill--success" style={{ marginTop: 4 }}>
                Tài khoản đang hoạt động
              </span>
            </div>
          </div>

          <form onSubmit={saveProfile} className="form">
            <label className="field">
              <span>Họ và tên hiển thị</span>
              <input
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                required
              />
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

            <div className="row-end">
              <button type="submit" className="btn btn--primary" disabled={savingProfile}>
                {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </section>

        <div>
          <section className="card card--interactive">
            <div className="card__head">
              <div className="card__title-group">
                <Icon name="sun" className="card__title-icon" />
                <h2>Chủ đề giao diện</h2>
              </div>
            </div>

            <div className="theme-cards">
              {THEMES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={`theme-card${theme === t.value ? ' theme-card--active' : ''}`}
                  onClick={() => setTheme(t.value)}
                >
                  <span className="theme-card__icon">
                    <Icon name={t.icon} size={20} />
                  </span>
                  <strong>{t.label}</strong>
                  <small>{t.desc}</small>
                </button>
              ))}
            </div>
          </section>

          <section className="card card--interactive">
            <div className="card__head">
              <div className="card__title-group">
                <Icon name="pencil" className="card__title-icon" />
                <h2>Đổi mật khẩu</h2>
              </div>
            </div>

            <form onSubmit={savePassword} className="form">
              <label className="field">
                <span>Mật khẩu hiện tại</span>
                <div className="input-with-action">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                    autoComplete="current-password"
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

              <div className="grid-2">
                <label className="field">
                  <span>Mật khẩu mới (≥ 6 ký tự)</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    minLength={6}
                    autoComplete="new-password"
                    required
                  />
                </label>

                <label className="field">
                  <span>Xác nhận mật khẩu mới</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    autoComplete="new-password"
                    required
                  />
                </label>
              </div>

              <div className="row-end">
                <button type="submit" className="btn btn--primary" disabled={savingPassword}>
                  {savingPassword ? 'Đang đổi...' : 'Cập nhật mật khẩu'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
