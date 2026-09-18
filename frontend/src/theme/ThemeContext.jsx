import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export const THEMES = [
  {
    id: 'midnight',
    label: 'Midnight',
    hint: 'Default SOC blue',
    swatch: ['#0a0e1a', '#3b82f6', '#06b6d4'],
  },
  {
    id: 'obsidian',
    label: 'Obsidian',
    hint: 'Pure black terminal',
    swatch: ['#000000', '#22c55e', '#4ade80'],
  },
  {
    id: 'aurora',
    label: 'Aurora',
    hint: 'Violet night shift',
    swatch: ['#100a1f', '#a855f7', '#ec4899'],
  },
  {
    id: 'daylight',
    label: 'Daylight',
    hint: 'Light, high contrast',
    swatch: ['#f1f5f9', '#2563eb', '#0891b2'],
  },
];

const STORAGE_KEY = 'threatlens.theme';
const DEFAULT_THEME = 'midnight';
const VALID = THEMES.map((t) => t.id);

const ThemeContext = createContext({
  theme: DEFAULT_THEME,
  setTheme: () => {},
  themes: THEMES,
});

function readStoredTheme() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && VALID.includes(stored)) return stored;
  } catch {
    /* storage unavailable — fall through */
  }
  try {
    if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'daylight';
  } catch {
    /* matchMedia unavailable */
  }
  return DEFAULT_THEME;
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStoredTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore persistence failures */
    }
  }, [theme]);

  const setTheme = (next) => {
    if (!VALID.includes(next)) return;
    // Applied imperatively first so that components reading computed CSS tokens
    // (Recharts needs literal colours) see the new palette on the very next render.
    document.documentElement.setAttribute('data-theme', next);
    setThemeState(next);
  };

  const value = useMemo(() => ({ theme, setTheme, themes: THEMES }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * Reads the live computed value of a CSS token (e.g. '--danger').
 * Recharts needs literal colour strings, so charts use this instead of var().
 */
export function useThemeTokens(names) {
  const { theme } = useTheme();
  const key = names.join(',');

  return useMemo(() => {
    const styles = getComputedStyle(document.documentElement);
    const out = {};
    names.forEach((n) => {
      out[n] = styles.getPropertyValue(`--${n}`).trim() || '#3b82f6';
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, key]);
}
