import { AppTheme } from '../types';

export const theme: AppTheme = {
  colors: {
    background: '#ffffff',
    surface: '#eafaf1', // light green box color
    surfaceAlt: '#ffffff',
    primary: '#000000',
    primaryLight: '#333333',
    accent: '#000000',
    success: '#000000',
    successLight: '#cccccc',
    danger: '#000000',
    dangerLight: '#999999',
    warning: '#000000',
    textPrimary: '#000000',
    textSecondary: '#404040',
    textMuted: '#737373',
    border: '#000000',
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
