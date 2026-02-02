import { MD3LightTheme, configureFonts } from 'react-native-paper';

// Ghana flag colors
export const colors = {
  // Primary - Ghana Green
  primary: '#006B3F',
  primaryLight: '#4CAF50',
  primaryDark: '#004D2C',

  // Secondary - Ghana Yellow/Gold
  secondary: '#FCD116',
  secondaryLight: '#FFEB3B',
  secondaryDark: '#C9A800',

  // Accent - Ghana Red
  accent: '#CE1126',
  accentLight: '#FF5252',
  accentDark: '#9B0D1C',

  // Neutrals
  background: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceVariant: '#F0F0F0',

  // Text
  text: '#1A1A1A',
  textSecondary: '#666666',
  textLight: '#999999',
  textOnPrimary: '#FFFFFF',
  textOnSecondary: '#1A1A1A',

  // Status
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',

  // Borders
  border: '#E0E0E0',
  divider: '#EEEEEE',

  // Shadows
  shadow: 'rgba(0, 0, 0, 0.1)',
};

// Font configuration
const fontConfig = {
  displayLarge: {
    fontFamily: 'System',
    fontSize: 57,
    fontWeight: '400' as const,
    letterSpacing: -0.25,
    lineHeight: 64,
  },
  displayMedium: {
    fontFamily: 'System',
    fontSize: 45,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 52,
  },
  displaySmall: {
    fontFamily: 'System',
    fontSize: 36,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 44,
  },
  headlineLarge: {
    fontFamily: 'System',
    fontSize: 32,
    fontWeight: '600' as const,
    letterSpacing: 0,
    lineHeight: 40,
  },
  headlineMedium: {
    fontFamily: 'System',
    fontSize: 28,
    fontWeight: '600' as const,
    letterSpacing: 0,
    lineHeight: 36,
  },
  headlineSmall: {
    fontFamily: 'System',
    fontSize: 24,
    fontWeight: '600' as const,
    letterSpacing: 0,
    lineHeight: 32,
  },
  titleLarge: {
    fontFamily: 'System',
    fontSize: 22,
    fontWeight: '500' as const,
    letterSpacing: 0,
    lineHeight: 28,
  },
  titleMedium: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.15,
    lineHeight: 24,
  },
  titleSmall: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  bodyLarge: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.5,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '400' as const,
    letterSpacing: 0.25,
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '400' as const,
    letterSpacing: 0.4,
    lineHeight: 16,
  },
  labelLarge: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  labelMedium: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  labelSmall: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
};

// Paper theme
export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryLight,
    secondary: colors.secondary,
    secondaryContainer: colors.secondaryLight,
    tertiary: colors.accent,
    tertiaryContainer: colors.accentLight,
    surface: colors.surface,
    surfaceVariant: colors.surfaceVariant,
    background: colors.background,
    error: colors.error,
    errorContainer: '#FDECEA',
    onPrimary: colors.textOnPrimary,
    onSecondary: colors.textOnSecondary,
    onBackground: colors.text,
    onSurface: colors.text,
    outline: colors.border,
    outlineVariant: colors.divider,
  },
  fonts: configureFonts({ config: fontConfig }),
  roundness: 12,
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

// Typography
export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: '600' as const,
    lineHeight: 36,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
};

// Currency formatting utility - works reliably in Hermes/React Native
export const formatCurrency = (amount: number | string | undefined | null): string => {
  // Handle string amounts (from API), undefined, null, or NaN
  let safeAmount: number;
  if (typeof amount === 'string') {
    safeAmount = parseFloat(amount) || 0;
  } else if (typeof amount === 'number' && !isNaN(amount)) {
    safeAmount = amount;
  } else {
    safeAmount = 0;
  }
  const fixed = safeAmount.toFixed(2);
  const parts = fixed.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `GH₵ ${parts.join('.')}`;
};

export default theme;
