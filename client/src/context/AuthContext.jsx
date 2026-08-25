import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Khôi phục phiên đăng nhập từ token đã lưu
  useEffect(() => {
    const token = localStorage.getItem('wq_token');
    if (!token) return setLoading(false);

    api
      .get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => localStorage.removeItem('wq_token'))
      .finally(() => setLoading(false));
  }, []);

  const handleAuth = ({ token, user: nextUser }) => {
    localStorage.setItem('wq_token', token);
    setUser(nextUser);
    return nextUser;
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login: async (email, password) => handleAuth((await api.post('/auth/login', { email, password })).data),
      register: async (payload) => handleAuth((await api.post('/auth/register', payload)).data),
      logout: () => {
        localStorage.removeItem('wq_token');
        setUser(null);
      },
      updateUser: setUser,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải được dùng bên trong <AuthProvider>');
  return ctx;
}
