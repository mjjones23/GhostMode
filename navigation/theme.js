import { DarkTheme } from '@react-navigation/native';

export const GhostNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#a78bfa',
    background: '#0a0a12',
    card: '#0a0a12',
    text: '#ffffff',
    border: 'rgba(255, 255, 255, 0.08)',
    notification: '#7c3aed',
  },
};

export const tabBarStyles = {
  backgroundColor: 'rgba(10, 10, 18, 0.98)',
  borderTopColor: 'rgba(255, 255, 255, 0.08)',
  borderTopWidth: 1,
  paddingTop: 8,
  height: 88,
};

export const stackScreenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: '#0a0a12' },
  animation: 'fade_from_bottom',
};

export const modalScreenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: '#0a0a12' },
  presentation: 'modal',
  animation: 'slide_from_bottom',
};
