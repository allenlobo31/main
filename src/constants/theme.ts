import { AppTheme } from '../types';

export const theme: AppTheme = {
  colors: {
    background: '#0f0f1a',
    surface: '#1e1e38',
    surfaceAlt: '#13132a',
    primary: '#7c6ef7',
    primaryLight: '#a78bfa',
    accent: '#5b8dd9',
    success: '#3a7050',
    successLight: '#5a9070',
    danger: '#d45a7c',
    dangerLight: '#f07090',
    warning: '#e0a040',
    textPrimary: '#ffffff',
    textSecondary: '#aaaacc',
    textMuted: '#666688',
    border: '#333355',
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
  background: '#f0f0f8',
  surface: '#ffffff',
  surfaceAlt: '#e8e8f0',
  textPrimary: '#0f0f1a',
  textSecondary: '#444466',
  textMuted: '#888899',
  border: '#ccccdd',
};
