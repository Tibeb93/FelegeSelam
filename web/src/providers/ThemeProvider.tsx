'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read stored theme from cookie or localStorage or prefers-color-scheme
    const storedTheme = (localStorage.getItem('fs_theme') as Theme) ||
      (document.cookie.match(/(?:^|; )fs_theme=([^;]*)/)?.[1] as Theme);

    const initialTheme: Theme =
      storedTheme === 'dark' || storedTheme === 'light'
        ? storedTheme
        : window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';

    setThemeState(initialTheme);
    applyThemeClass(initialTheme);
    setMounted(true);
  }, []);

  const applyThemeClass = (newTheme: Theme) => {
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyThemeClass(newTheme);
    localStorage.setItem('fs_theme', newTheme);
    document.cookie = `fs_theme=${newTheme}; path=/; max-age=31536000; SameSite=Lax`;
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Provide initial theme during hydration to prevent mismatch
  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
