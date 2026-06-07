/**
 * Backward-compatible facade for older imports.
 * New code should import from services/purchasesService.js directly.
 */
import {
  configurePurchases,
  getOfferings,
  purchasePackage,
  restorePurchases,
  checkPremiumStatus,
  isLivePurchasesEnabled,
  PRODUCT_IDS,
  REVENUECAT_ENTITLEMENT_ID,
  USE_DEMO_PURCHASES,
} from '../services/purchasesService';
import { PAYWALL_PLANS } from '../config/revenuecat';

export {
  configurePurchases,
  getOfferings,
  purchasePackage,
  restorePurchases,
  checkPremiumStatus,
  PRODUCT_IDS,
  REVENUECAT_ENTITLEMENT_ID,
  USE_DEMO_PURCHASES,
};

export function isRevenueCatConfigured() {
  return isLivePurchasesEnabled();
}

export function getPaywallPlans() {
  return PAYWALL_PLANS;
}

export function getPlanById(planId) {
  return PAYWALL_PLANS.find((plan) => plan.id === planId) ?? null;
}

export function getPlanByProductId(productId) {
  return PAYWALL_PLANS.find((plan) => plan.productId === productId) ?? null;
}

/** @deprecated Use configurePurchases instead. */
export async function initializeRevenueCat() {
  return configurePurchases();
}

/** @deprecated Use checkPremiumStatus instead — returns boolean for PremiumContext. */
export async function checkPremiumEntitlement() {
  const status = await checkPremiumStatus();
  return status.isPremium;
}

/** @deprecated Use getOfferings instead. */
export async function getOfferingsForPaywall() {
  return getOfferings();
}

/** @deprecated Use purchasePackage instead. */
export async function purchaseSubscription(planId) {
  return purchasePackage({ planId });
}
