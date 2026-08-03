import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { loadDeveloperPremium, saveDeveloperPremium } from '../utils/storage';
import {
  checkPremiumStatus,
  configurePurchases,
} from '../services/purchasesService';
import { isAppReviewPremiumEmail } from '../config/appReview';
import { PREMIUM_ENABLED } from '../config/premiumFlags';
import { useAuth } from './AuthContext';

const PremiumContext = createContext({
  isPremium: false,
  developerPremium: false,
  subscriptionPremium: false,
  reviewPremium: false,
  premiumLoaded: false,
  premiumEnabled: PREMIUM_ENABLED,
  refreshPremium: async () => {},
  setDeveloperPremium: async () => {},
});

export function PremiumProvider({ children }) {
  const { user } = useAuth();
  const [developerPremium, setDeveloperPremiumState] = useState(false);
  const [subscriptionPremium, setSubscriptionPremium] = useState(false);
  // App Review bypass — only ghostmode.apple.review@gmail.com (see config/appReview.js)
  const [reviewPremium, setReviewPremium] = useState(false);
  const [premiumLoaded, setPremiumLoaded] = useState(false);

  const refreshPremium = useCallback(async () => {
    await configurePurchases();

    const [devEnabled, premiumStatus] = await Promise.all([
      loadDeveloperPremium(),
      checkPremiumStatus(),
    ]);

    setDeveloperPremiumState(devEnabled);
    setSubscriptionPremium(premiumStatus.isPremium);
    setPremiumLoaded(true);
  }, []);

  useEffect(() => {
    refreshPremium();
  }, [refreshPremium]);

  // Unlock Premium exclusively for the Apple App Review account after sign-in.
  useEffect(() => {
    setReviewPremium(isAppReviewPremiumEmail(user?.email));
  }, [user?.email]);

  const setDeveloperPremium = useCallback(async (enabled) => {
    await saveDeveloperPremium(enabled);
    setDeveloperPremiumState(Boolean(enabled));
  }, []);

  const subscribedOrBypass =
    developerPremium || subscriptionPremium || reviewPremium;

  return (
    <PremiumContext.Provider
      value={{
        // Free period: every user has full access while PREMIUM_ENABLED is false.
        isPremium: !PREMIUM_ENABLED || subscribedOrBypass,
        developerPremium,
        subscriptionPremium,
        reviewPremium,
        premiumLoaded,
        premiumEnabled: PREMIUM_ENABLED,
        refreshPremium,
        setDeveloperPremium,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  return useContext(PremiumContext);
}
