import React, { createContext, useContext, useMemo, useState } from 'react';
import { darkColors, lightColors } from './theme';

const ThemeContext = createContext(null);

/**
 * Wraps the app and provides the active color palette plus controls to
 * switch between dark and light mode. Defaults to dark, matching the
 * original Pharm36 brand styling.
 */
export function ThemeProvider({ children, initialScheme = 'dark' }) {
  const [scheme, setScheme] = useState(initialScheme);

  const value = useMemo(() => {
    const colors = scheme === 'light' ? lightColors : darkColors;
    return {
      scheme,
      isDark: scheme === 'dark',
      colors,
      toggleTheme: () => setScheme((s) => (s === 'dark' ? 'light' : 'dark')),
      setScheme,
    };
  }, [scheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
