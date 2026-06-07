import { Platform } from 'react-native';
import {
  PAYWALL_PLANS,
  PRODUCT_IDS,
  REVENUECAT_ANDROID_API_KEY,
  REVENUECAT_ENTITLEMENT_ID,
  REVENUECAT_IOS_API_KEY,
  REVENUECAT_PLACEHOLDER_IOS_API_KEY,
  USE_DEMO_PURCHASES,
} from '../config/revenuecat';

/**
 * Ghost Mode purchases service (RevenueCat-ready, demo-safe today).
 *
 * These functions mirror the real RevenueCat SDK flow without calling App Store yet.
 * Pre-release: Settings → Premium access toggle (__DEV__ only) unlocks Premium for testing.
 * Does not go through this file.
 *
 * When you connect App Store later:
 *   1. npm install react-native-purchases
 *   2. Add EXPO_PUBLIC_REVENUECAT_IOS_API_KEY to .env (see config/revenuecat.js)
 *   3. Uncomment the Purchases.* calls in each function below
 *   4. Set USE_DEMO_PURCHASES = false in config/revenuecat.js
 */

let configured = false;
let cachedPremiumActive = false;

function getApiKeyForPlatform() {
  if (Platform.OS === 'ios') return REVENUECAT_IOS_API_KEY;
  if (Platform.OS === 'android') return REVENUECAT_ANDROID_API_KEY;
  return '';
}

export function hasRevenueCatApiKey() {
  const key = getApiKeyForPlatform();
  return Boolean(key) && key !== REVENUECAT_PLACEHOLDER_IOS_API_KEY;
}

export function isLivePurchasesEnabled() {
  return hasRevenueCatApiKey() && !USE_DEMO_PURCHASES;
}

function findPlan({ planId, productId, packageIdentifier }) {
  if (planId) {
    return PAYWALL_PLANS.find((plan) => plan.id === planId) ?? null;
  }

  if (productId) {
    return PAYWALL_PLANS.find((plan) => plan.productId === productId) ?? null;
  }

  if (packageIdentifier) {
    return (
      PAYWALL_PLANS.find((plan) => plan.revenueCatPackageType === packageIdentifier) ??
      null
    );
  }

  return null;
}

/**
 * Initializes RevenueCat on app launch (Purchases.configure).
 * Safe no-op in demo mode — Expo Go keeps working.
 */
export async function configurePurchases() {
  if (configured) {
    return {
      ready: true,
      mode: USE_DEMO_PURCHASES ? 'demo' : isLivePurchasesEnabled() ? 'live' : 'missing_api_key',
    };
  }

  const apiKey = getApiKeyForPlatform();

  if (isLivePurchasesEnabled()) {
    // LATER (real App Store subscriptions):
    // import Purchases from 'react-native-purchases';
    // Purchases.configure({ apiKey });
    // const customerInfo = await Purchases.getCustomerInfo();
    // cachedPremiumActive = Boolean(
    //   customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID]
    // );
  }

  configured = true;

  return {
    ready: true,
    mode: USE_DEMO_PURCHASES ? 'demo' : apiKey ? 'live' : 'missing_api_key',
  };
}

/**
 * Loads subscription packages from RevenueCat offerings.
 * Demo mode returns static plans from config (ghost_monthly, ghost_yearly).
 */
export async function getOfferings() {
  await configurePurchases();

  if (isLivePurchasesEnabled()) {
    // LATER (real App Store subscriptions):
    // import Purchases from 'react-native-purchases';
    // const offerings = await Purchases.getOfferings();
    // const current = offerings.current;
    // if (!current) return { identifier: null, demo: false, packages: [] };
    // return {
    //   identifier: current.identifier,
    //   demo: false,
    //   packages: current.availablePackages.map((pkg) => ({
    //     identifier: pkg.identifier,
    //     productId: pkg.product.identifier,
    //     planId: getPlanByProductId(pkg.product.identifier)?.id ?? null,
    //     priceString: pkg.product.priceString,
    //     plan: getPlanByProductId(pkg.product.identifier),
    //     revenueCatPackage: pkg,
    //   })),
    // };
  }

  return {
    identifier: 'ghost_mode_default',
    demo: true,
    packages: PAYWALL_PLANS.map((plan) => ({
      identifier: plan.revenueCatPackageType,
      productId: plan.productId,
      planId: plan.id,
      priceString: plan.priceLabel,
      plan,
    })),
  };
}

/**
 * Starts a subscription purchase for a paywall package.
 * Pre-release builds return demo: true until RevenueCat + App Store are connected.
 */
export async function purchasePackage({ planId, productId, packageIdentifier } = {}) {
  const plan = findPlan({ planId, productId, packageIdentifier });

  if (!plan) {
    return { success: false, error: 'invalid_package' };
  }

  await configurePurchases();

  if (USE_DEMO_PURCHASES || !isLivePurchasesEnabled()) {
    return {
      success: true,
      demo: true,
      plan,
      productId: plan.productId,
      message: 'In-app purchases are not connected yet.',
    };
  }

  // LATER (real App Store subscriptions):
  // import Purchases from 'react-native-purchases';
  // const offerings = await Purchases.getOfferings();
  // const pkg = offerings.current?.availablePackages.find(
  //   (item) => item.product.identifier === plan.productId
  // );
  // if (!pkg) return { success: false, error: 'product_not_found' };
  // const { customerInfo } = await Purchases.purchasePackage(pkg);
  // cachedPremiumActive = Boolean(
  //   customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID]
  // );
  // return {
  //   success: cachedPremiumActive,
  //   demo: false,
  //   plan,
  //   productId: plan.productId,
  // };

  return { success: false, error: 'not_configured', plan, productId: plan.productId };
}

/**
 * Restores previous App Store purchases through RevenueCat.
 */
export async function restorePurchases() {
  await configurePurchases();

  if (USE_DEMO_PURCHASES || !isLivePurchasesEnabled()) {
    return {
      restored: false,
      demo: true,
      title: 'No subscription found',
      message:
        'We could not find an active Ghost Mode Premium subscription for this Apple ID.',
    };
  }

  // LATER (real App Store subscriptions):
  // import Purchases from 'react-native-purchases';
  // const customerInfo = await Purchases.restorePurchases();
  // cachedPremiumActive = Boolean(
  //   customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID]
  // );
  // return {
  //   restored: cachedPremiumActive,
  //   demo: false,
  //   title: cachedPremiumActive ? 'Premium restored' : 'No subscription found',
  //   message: cachedPremiumActive
  //     ? 'Your Ghost Mode Premium subscription is active again.'
  //     : 'We could not find an active subscription for this Apple ID.',
  // };

  return {
    restored: false,
    demo: false,
    title: 'Subscriptions unavailable',
    message: 'Restore purchases is not available yet. Please try again later.',
  };
}

/**
 * Checks whether the user has an active RevenueCat premium entitlement.
 * Does not include the Settings premium access toggle — PremiumContext merges both sources.
 */
export async function checkPremiumStatus() {
  await configurePurchases();

  if (USE_DEMO_PURCHASES || !isLivePurchasesEnabled()) {
    return {
      isPremium: false,
      source: 'none',
      entitlementId: REVENUECAT_ENTITLEMENT_ID,
      productIds: PRODUCT_IDS,
    };
  }

  // LATER (real App Store subscriptions):
  // import Purchases from 'react-native-purchases';
  // const customerInfo = await Purchases.getCustomerInfo();
  // cachedPremiumActive = Boolean(
  //   customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID]
  // );

  return {
    isPremium: cachedPremiumActive,
    source: cachedPremiumActive ? 'subscription' : 'none',
    entitlementId: REVENUECAT_ENTITLEMENT_ID,
    productIds: PRODUCT_IDS,
  };
}

export { PRODUCT_IDS, REVENUECAT_ENTITLEMENT_ID, USE_DEMO_PURCHASES };
