/**
 * Ghost Mode Free vs Pro entitlement map (Batch 2).
 * Live App Store purchases are not connected yet — see revenuecat.js.
 */

import { AI_QUOTA_ENABLED, PREMIUM_ENABLED } from './premiumFlags';

export { AI_QUOTA_ENABLED, PREMIUM_ENABLED };

/** Proposed App Store pricing (display only until IAP goes live). */
export const PRO_PRICING = {
  monthly: {
    id: 'monthly',
    productId: 'ghost_monthly',
    priceLabel: '$4.99/month',
    priceUsd: 4.99,
    detail: 'Cancel anytime',
  },
  yearly: {
    id: 'yearly',
    productId: 'ghost_yearly',
    priceLabel: '$39.99/year',
    priceUsd: 39.99,
    detail: 'Best value',
    badge: 'Best value',
  },
};

/** Free allowance for AI Coach messages (rolling window). */
export const FREE_AI_QUOTA = {
  limit: 10,
  windowMs: 5 * 60 * 60 * 1000, // 5 hours
  windowLabel: '5 hours',
};

/**
 * Pro AI allowance (server-configurable later via env).
 * Higher than free; not unlimited by default for cost control.
 */
export const PRO_AI_QUOTA = {
  limit: 200,
  windowMs: 5 * 60 * 60 * 1000,
  windowLabel: '5 hours',
};

/**
 * Entitlement keys used by gates and paywall copy.
 * Essential non-AI support stays free even when Pro gating is on.
 */
export const ENTITLEMENTS = {
  STREAK_TRACKER: { free: true, pro: true },
  JOURNAL_WRITE: { free: true, pro: true },
  JOURNAL_HISTORY_UNLIMITED: { free: false, pro: true },
  MOOD_CHECKIN: { free: true, pro: true },
  MOOD_HISTORY_UNLIMITED: { free: false, pro: true },
  DAILY_RECOVERY_PLAN: { free: true, pro: true },
  WEEKLY_PROGRESS_REPORT: { free: true, pro: true },
  CRISIS_SOS: { free: true, pro: true },
  AI_COACH: { free: true, pro: true },
  AI_COACH_UNLIMITED: { free: false, pro: true },
  AI_MEMORY: { free: true, pro: true },
  PROGRESS_INSIGHTS: { free: false, pro: true },
  DAILY_REMINDERS: { free: false, pro: true },
  MUSIC_PLAYER: { free: true, pro: true }, // free tracks available; some require Pro
  MUSIC_PRO_TRACKS: { free: false, pro: true },
  VOICE_COACH: { free: false, pro: true },
};

export function hasEntitlement(entitlementKey, isPro) {
  const row = ENTITLEMENTS[entitlementKey];
  if (!row) return false;
  if (!PREMIUM_ENABLED) return true;
  return isPro ? Boolean(row.pro) : Boolean(row.free);
}

export function shouldEnforceAiQuota(isPro) {
  if (!AI_QUOTA_ENABLED) return false;
  if (!PREMIUM_ENABLED) return false;
  return true; // both free and pro may have windows; limits differ server-side
}

export function getAiQuotaForTier(isPro) {
  return isPro ? PRO_AI_QUOTA : FREE_AI_QUOTA;
}
