/**
 * Ghost Mode Premium feature flag.
 *
 * false = every feature is free (v1.1 temporary free period).
 * true  = restore subscription gating / paywalls.
 *
 * Keep RevenueCat, product IDs, and purchasesService intact either way.
 */
export const PREMIUM_ENABLED = false;

/**
 * When true (and PREMIUM_ENABLED), free accounts are limited to
 * FREE_AI_QUOTA (10 messages / rolling 5 hours). Server enforces.
 * Keep false during the temporary free period.
 */
export const AI_QUOTA_ENABLED = false;
