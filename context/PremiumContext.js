import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { loadDeveloperPremium, saveDeveloperPremium } from '../utils/storage';
import {
  checkPremiumStatus,
  configurePurchases,
} from '../services/purchasesService';

const PremiumContext = createContext({
  isPremium: false,
  developerPremium: false,
  subscriptionPremium: false,
  premiumLoaded: false,
  refreshPremium: async () => {},
  setDeveloperPremium: async () => {},
});

export function PremiumProvider({ children }) {
  const [developerPremium, setDeveloperPremiumState] = useState(false);
  const [subscriptionPremium, setSubscriptionPremium] = useState(false);
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

  const setDeveloperPremium = useCallback(async (enabled) => {
    await saveDeveloperPremium(enabled);
    setDeveloperPremiumState(Boolean(enabled));
  }, []);

  return (
    <PremiumContext.Provider
      value={{
        isPremium: developerPremium || subscriptionPremium,
        developerPremium,
        subscriptionPremium,
        premiumLoaded,
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
