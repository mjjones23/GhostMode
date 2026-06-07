import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { usePremium } from '../context/PremiumContext';
import { navigateToAppScreen } from '../navigation/navigationHelpers';

export function usePremiumGate() {
  const navigation = useNavigation();
  const { isPremium } = usePremium();

  const openPaywall = useCallback(() => {
    navigateToAppScreen(navigation, 'Paywall');
  }, [navigation]);

  const requirePremium = useCallback(
    (onUnlocked) => {
      if (isPremium) {
        onUnlocked?.();
        return true;
      }
      openPaywall();
      return false;
    },
    [isPremium, openPaywall]
  );

  return { isPremium, requirePremium, openPaywall };
}
