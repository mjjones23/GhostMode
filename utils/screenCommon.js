import { Platform } from 'react-native';

export const GhostColors = {
  background: '#0a0a12',
  primary: '#a78bfa',
  accent: '#c4b5fd',
  purple: '#7c3aed',
  text: '#ffffff',
  textMuted: 'rgba(255, 255, 255, 0.65)',
  textSoft: 'rgba(255, 255, 255, 0.45)',
  card: 'rgba(255, 255, 255, 0.05)',
  cardBorder: 'rgba(167, 139, 250, 0.22)',
  danger: 'rgba(248, 113, 113, 0.45)',
};

export const GhostSpacing = {
  screenHorizontal: 24,
  screenHorizontalWide: 28,
  screenBottom: 32,
  sectionGap: 16,
  maxContentWidth: 340,
};

export const ghostPressable = Platform.select({
  web: { cursor: 'pointer' },
  default: {},
}) || {};

export const ghostPressedStyle = {
  opacity: 0.88,
  transform: [{ scale: 0.98 }],
};
