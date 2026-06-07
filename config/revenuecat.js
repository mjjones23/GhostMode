/**
 * RevenueCat setup for Ghost Mode (Apple subscriptions)
 *
 * ─── LATER: add your real RevenueCat API keys ───
 * 1. Create a project at https://app.revenuecat.com
 * 2. Add an iOS app linked to bundle ID: com.ghostmode.app
 * 3. Copy the **Public app-specific API key** (Apple) from:
 *    RevenueCat dashboard → Project → API keys
 * 4. Put it in a root `.env` file (recommended):
 *      EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_xxxxxxxx
 *    Optional Android key for later:
 *      EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_xxxxxxxx
 * 5. Create matching products in App Store Connect:
 *      ghost_monthly, ghost_yearly
 * 6. Map those products to a "premium" entitlement in RevenueCat
 * 7. Install react-native-purchases and set USE_DEMO_PURCHASES = false
 *
 * Do NOT paste secret API keys here. Only public SDK keys belong in the app.
 */

/**
 * Placeholder shown in docs and .env.example — not used at runtime unless copied into .env.
 * Replace with your real public key from RevenueCat → Project → API keys (Apple).
 */
export const REVENUECAT_PLACEHOLDER_IOS_API_KEY = 'appl_your_revenuecat_public_key_here';

/** Public RevenueCat SDK key for iOS — empty until you add .env (see above). */
export const REVENUECAT_IOS_API_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || '';

/** Public RevenueCat SDK key for Android — optional for now. */
export const REVENUECAT_ANDROID_API_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || '';

/**
 * Entitlement identifier in RevenueCat (must match dashboard).
 * Users with this entitlement are treated as Premium subscribers.
 */
export const REVENUECAT_ENTITLEMENT_ID = 'premium';

/**
 * App Store / Google Play product IDs.
 * These must match exactly what you create in App Store Connect later.
 */
export const PRODUCT_IDS = {
  MONTHLY: 'ghost_monthly',
  YEARLY: 'ghost_yearly',
};

/**
 * When true, purchases use demo alerts only (no App Store charge).
 * Set to false after RevenueCat + App Store Connect are configured.
 */
export const USE_DEMO_PURCHASES = true;

/**
 * Paywall plan metadata shown in the UI.
 * When RevenueCat is live, prices can be replaced with live `package.product.priceString`.
 */
export const PAYWALL_PLANS = [
  {
    id: 'monthly',
    productId: PRODUCT_IDS.MONTHLY,
    revenueCatPackageType: 'MONTHLY',
    name: 'Monthly',
    priceLabel: '$6.99/month',
    detail: 'Cancel anytime',
    badge: null,
  },
  {
    id: 'yearly',
    productId: PRODUCT_IDS.YEARLY,
    revenueCatPackageType: 'ANNUAL',
    name: 'Yearly',
    priceLabel: '$39.99/year',
    detail: 'Save 52% vs monthly',
    badge: 'Best value',
  },
];

export const DEFAULT_PAYWALL_PLAN_ID = 'yearly';
