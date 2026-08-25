import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const KEY = 'wq_theme';
const ThemeContext = createContext(null);

/** Đọc/ghi localStorage an toàn (chế độ riêng tư của trình duyệt có thể ném lỗi) */
const read = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};
const write = (value) => {
  try {
    localStorage.setItem(KEY, value);
  } catch {
    /* bỏ qua */
  }
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => read() || 'system');

  useEffect(() => {
    const root = document.documentElement;
    // 'system' = gỡ thuộc tính để CSS tự theo prefers-color-scheme
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    write(theme);
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme phải được dùng bên trong <ThemeProvider>');
  return ctx;
};
