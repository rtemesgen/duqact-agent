import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ThemePreference } from '../api/types';

type ThemeContextValue = { theme: ThemePreference; setTheme(next: ThemePreference): void };
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>(() => {
    const stored = localStorage.getItem('mobi_theme') as ThemePreference | null;
    const next = stored ?? 'DARK';
    document.documentElement.dataset.theme = next.toLowerCase();
    return next;
  });
  function setTheme(next: ThemePreference) {
    setThemeState(next);
    localStorage.setItem('mobi_theme', next);
    document.documentElement.dataset.theme = next.toLowerCase();
  }
  useEffect(() => { document.documentElement.dataset.theme = theme.toLowerCase(); }, [theme]);
  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('ThemeProvider missing');
  return ctx;
}
