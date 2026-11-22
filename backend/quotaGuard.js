const {
  QUOTA_ENFORCEMENT,
  PRO_ACCOUNT_IDS,
  PRO_BYPASS_SECRET,
  FREE_LIMIT,
  WINDOW_MS,
} = require('./quotaConfig');
const { getQuotaStatus, tryConsumeQuota, normalizeAccountId } = require('./quotaStore');
const { getEntitlement } = require('./entitlementStore');

const PRO_LIMIT = Number.parseInt(process.env.AI_PRO_MESSAGE_LIMIT || '200', 10) || 200;

function isProRequest(req, accountId) {
  const id = normalizeAccountId(accountId);
  if (id && PRO_ACCOUNT_IDS.has(id)) return true;

  if (PRO_BYPASS_SECRET) {
    const header = String(req.get('x-ghost-pro-bypass') || '').trim();
    if (header && header === PRO_BYPASS_SECRET) return true;
  }

  if (id) {
    const entitlement = getEntitlement(id);
    if (entitlement.ok && entitlement.active) return true;
  }

  return false;
}

function quotaExceededPayload(status, pro) {
  return {
    error: 'ai_quota_exceeded',
    message: pro
      ? 'You have reached your Ghost Mode Pro AI Coach limit for this window. It resets soon.'
      : 'You have reached the free AI Coach limit. It resets soon, or you can upgrade to Ghost Mode Pro.',
    limit: status.limit,
    used: status.used,
    remaining: 0,
    windowMs: status.windowMs,
    resetsAt: status.resetsAt,
    resetsAtIso: status.resetsAtIso,
    pro: Boolean(pro),
  };
}

/**
 * Enforce AI quota before expensive / chat work.
 * Free: FREE_LIMIT / window. Pro: higher configurable PRO_LIMIT / same window.
 * Crisis paths should call this with { skip: true }.
 */
async function enforceAiQuota(req, res, { accountId, skip = false } = {}) {
  if (skip || !QUOTA_ENFORCEMENT) {
    return { enforced: false, allowed: true, pro: false };
  }

  const id = normalizeAccountId(accountId || req.body?.accountId);
  if (!id) {
    res.status(400).json({
      error: 'accountId_required',
      message: 'Sign in so Ghost Mode can apply your AI message allowance.',
    });
    return { enforced: true, allowed: false, pro: false };
  }

  const pro = isProRequest(req, id);
  const limit = pro ? PRO_LIMIT : FREE_LIMIT;
  const result = await tryConsumeQuota(id, { limit, windowMs: WINDOW_MS });

  if (!result.ok) {
    res.status(400).json({
      error: 'accountId_required',
      message: result.error || 'Invalid account.',
    });
    return { enforced: true, allowed: false, pro };
  }

  if (!result.allowed) {
    res.status(429).json(quotaExceededPayload(result, pro));
    return { enforced: true, allowed: false, pro, status: result };
  }

  return {
    enforced: true,
    allowed: true,
    pro,
    accountId: id,
    status: result,
  };
}

async function readAiQuota(req) {
  const id = normalizeAccountId(req.query.accountId || req.body?.accountId);
  if (!id) {
    return { ok: false, error: 'accountId is required' };
  }
  const pro = isProRequest(req, id);
  const limit = pro ? PRO_LIMIT : FREE_LIMIT;
  const status = await getQuotaStatus(id);
  // Recompute remaining against the correct tier limit.
  const used = status.used || 0;
  const remaining = Math.max(0, limit - used);
  return {
    ok: true,
    accountId: id,
    pro,
    unlimited: false,
    limit,
    used,
    remaining,
    windowMs: WINDOW_MS,
    resetsAt: remaining === 0 ? status.resetsAt : null,
    resetsAtIso: remaining === 0 ? status.resetsAtIso : null,
    allowed: remaining > 0,
  };
}

module.exports = {
  enforceAiQuota,
  readAiQuota,
  isProRequest,
  quotaExceededPayload,
  PRO_LIMIT,
};
