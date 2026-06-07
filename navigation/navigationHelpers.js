import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';

export const ROOT_SCREENS = new Set([
  'Onboarding',
  'Login',
  'SignUp',
  'Setup',
  'MainTabs',
  'Reasons',
  'ProgressInsights',
  'StreakReset',
  'Emergency',
  'CrisisLock',
  'Paywall',
  'DailyReminder',
  'SafetyDisclaimer',
  'LegalDocument',
]);

export const TAB_SCREENS = new Set(['Home', 'Journal', 'Coach', 'Mood', 'Settings']);

export const HOME_STACK_SCREENS = new Set(['HomeDashboard', 'DailyCheckIn']);

export function getRootNavigation(navigation) {
  let root = navigation;

  let current = navigation;
  while (current?.getParent?.()) {
    current = current.getParent();
    root = current;
  }

  return root;
}

export function getTabNavigation(navigation) {
  let current = navigation;

  while (current) {
    const state = current.getState?.();
    if (state?.type === 'tab') {
      return current;
    }

    if (!current.getParent?.()) {
      break;
    }

    current = current.getParent();
  }

  return navigation.getParent?.() ?? navigation;
}

export function navigateToAppScreen(navigation, screen, params) {
  if (HOME_STACK_SCREENS.has(screen)) {
    const state = navigation.getState?.();
    if (state?.routeNames?.includes(screen)) {
      navigation.navigate(screen, params);
      return;
    }

    getTabNavigation(navigation).navigate('Home', { screen, params });
    return;
  }

  if (TAB_SCREENS.has(screen)) {
    getTabNavigation(navigation).navigate(screen, params);
    return;
  }

  if (ROOT_SCREENS.has(screen)) {
    getRootNavigation(navigation).navigate(screen, params);
    return;
  }

  getRootNavigation(navigation).navigate(screen, params);
}

export function useAppNavigation() {
  const navigation = useNavigation();

  const navigateToScreen = useCallback(
    (screen, params) => {
      navigateToAppScreen(navigation, screen, params);
    },
    [navigation]
  );

  return {
    navigation,
    navigateToScreen,
    navigateToRoot: navigateToScreen,
  };
}
