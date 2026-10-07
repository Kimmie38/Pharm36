// Pharm36 design tokens — derived from the brand mark (teal-to-green gradient cross + capsule)

export const darkColors = {
  bg: '#060A0C',            // near-black app background (matches logo plate)
  bgElevated: '#0D1417',    // cards / sheets
  bgElevated2: '#121B1F',   // nested surfaces, inputs
  border: '#1E2A2E',

  tealDeep: '#0A4A5C',
  teal: '#0F6B82',
  green: '#1FAE74',
  greenLight: '#33C98A',

  gradientStart: '#0A4A5C',
  gradientEnd: '#1FAE74',

  textPrimary: '#F2F7F6',
  textSecondary: '#9FB0B3',
  textMuted: '#5F7377',

  danger: '#E4483F',
  dangerGlow: 'rgba(228,72,63,0.35)',
  warning: '#E8A33D',
  success: '#2ECC81',
  info: '#3DA9E8',

  scheme: 'dark',
};

export const lightColors = {
  bg: '#F4F8F7',            // soft off-white app background
  bgElevated: '#FFFFFF',    // cards / sheets
  bgElevated2: '#EDF3F2',   // nested surfaces, inputs
  border: '#DCE6E4',

  tealDeep: '#0A4A5C',
  teal: '#0F6B82',
  green: '#189A66',
  greenLight: '#1FAE74',

  gradientStart: '#0A4A5C',
  gradientEnd: '#1FAE74',

  textPrimary: '#0B1B1D',
  textSecondary: '#4C6165',
  textMuted: '#80989C',

  danger: '#D93E35',
  dangerGlow: 'rgba(217,62,53,0.28)',
  warning: '#C6821E',
  success: '#1E9E63',
  info: '#2A7FB8',

  scheme: 'light',
};

// Default export used only by non-reactive contexts. Screens/components should read
// colors via useTheme() from ThemeContext instead, so they respond to the dark/light toggle.
export const colors = darkColors;

export const gradients = {
  brand: [darkColors.tealDeep, darkColors.green],
  brandVertical: [darkColors.tealDeep, darkColors.greenLight],
  danger: ['#7A1A16', darkColors.danger],
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const type = {
  display: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  h1: { fontSize: 26, fontWeight: '800', letterSpacing: -0.3 },
  h2: { fontSize: 20, fontWeight: '700' },
  h3: { fontSize: 17, fontWeight: '700' },
  body: { fontSize: 15, fontWeight: '400' },
  bodyMedium: { fontSize: 15, fontWeight: '600' },
  small: { fontSize: 13, fontWeight: '400' },
  tiny: { fontSize: 11, fontWeight: '600', letterSpacing: 0.4 },
};

export default { colors, darkColors, lightColors, gradients, spacing, radius, type };
