import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { usePremium } from '../context/PremiumContext';
import { navigateToAppScreen } from '../navigation/navigationHelpers';
import { PREMIUM_ENABLED } from '../config/premiumFlags';

export function usePremiumGate() {
  const navigation = useNavigation();
  const { isPremium: subscribedPremium } = usePremium();

  // Free period: treat every user as unlocked without deleting subscription plumbing.
  const isPremium = !PREMIUM_ENABLED || subscribedPremium;

  const openPaywall = useCallback(() => {
    if (!PREMIUM_ENABLED) return;
    navigateToAppScreen(navigation, 'Paywall');
  }, [navigation]);

  const requirePremium = useCallback(
    (onUnlocked) => {
      if (!PREMIUM_ENABLED || isPremium) {
        onUnlocked?.();
        return true;
      }
      openPaywall();
      return false;
    },
    [isPremium, openPaywall]
  );

  return { isPremium, requirePremium, openPaywall, premiumEnabled: PREMIUM_ENABLED };
}
