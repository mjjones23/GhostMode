import { FREE_AI_QUOTA } from '../config/proEntitlements';
import { AI_QUOTA_ENABLED, PREMIUM_ENABLED } from '../config/premiumFlags';

export function formatQuotaResetTime(resetsAt) {
  if (!resetsAt) return null;
  const date = new Date(typeof resetsAt === 'number' ? resetsAt : resetsAt);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString(undefined, {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function buildQuotaLimitCopy(quota) {
  const resetLabel = formatQuotaResetTime(quota?.resetsAt || quota?.resetsAtIso);
  return {
    title: 'Free AI limit reached',
    body: resetLabel
      ? `You've used your ${FREE_AI_QUOTA.limit} free AI Coach messages for this ${FREE_AI_QUOTA.windowLabel} window. Your limit resets around ${resetLabel}.`
      : `You've used your free AI Coach messages for now. Upgrade to Ghost Mode Pro for unlimited coaching, or try again after the window resets.`,
    resetLabel,
    upgradeLabel: 'See Ghost Mode Pro',
  };
}

export function clientShouldEnforceQuota(_isPro) {
  // Free and Pro both use server windows when flags are on; limits differ by tier.
  if (!AI_QUOTA_ENABLED || !PREMIUM_ENABLED) return false;
  return true;
}

export function parseQuotaExceededResponse(data, status) {
  if (status !== 429 && data?.error !== 'ai_quota_exceeded') return null;
  return {
    error: 'ai_quota_exceeded',
    limit: data?.limit ?? FREE_AI_QUOTA.limit,
    used: data?.used ?? FREE_AI_QUOTA.limit,
    remaining: 0,
    windowMs: data?.windowMs ?? FREE_AI_QUOTA.windowMs,
    resetsAt: data?.resetsAt ?? null,
    resetsAtIso: data?.resetsAtIso ?? null,
    message: data?.message || 'Free AI limit reached.',
  };
}
