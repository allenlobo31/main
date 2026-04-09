import { AppTheme } from '../types';

export const theme: AppTheme = {
  colors: {
    background: '#0b1020',
    surface: '#151b2f',
    surfaceAlt: '#10182a',
    primary: '#6f86ff',
    primaryLight: '#9bb0ff',
    accent: '#66a6ff',
    success: '#2e6f57',
    successLight: '#69a68a',
    danger: '#d45f78',
    dangerLight: '#f07f99',
    warning: '#e0a64a',
    textPrimary: '#ffffff',
    textSecondary: '#c1c8e8',
    textMuted: '#7c86ab',
    border: '#24304d',
  },
  typography: {
    h1: { fontSize: 24, fontWeight: '700' },
    h2: { fontSize: 20, fontWeight: '600' },
    h3: { fontSize: 16, fontWeight: '600' },
    body: { fontSize: 14, fontWeight: '400' },
    caption: { fontSize: 12, fontWeight: '400' },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
};

export const lightThemeOverrides: Partial<AppTheme['colors']> = {
  background: '#f5f7fc',
  surface: '#ffffff',
  surfaceAlt: '#edf1f9',
  textPrimary: '#0f0f1a',
  textSecondary: '#444466',
  textMuted: '#888899',
  border: '#d7def0',
};
