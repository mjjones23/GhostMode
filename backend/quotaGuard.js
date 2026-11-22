const {
  QUOTA_ENFORCEMENT,
  PRO_ACCOUNT_IDS,
  PRO_BYPASS_SECRET,
} = require('./quotaConfig');
const { getQuotaStatus, tryConsumeQuota, normalizeAccountId } = require('./quotaStore');

function isProRequest(req, accountId) {
  const id = normalizeAccountId(accountId);
  if (id && PRO_ACCOUNT_IDS.has(id)) return true;

  if (PRO_BYPASS_SECRET) {
    const header = String(req.get('x-ghost-pro-bypass') || '').trim();
    if (header && header === PRO_BYPASS_SECRET) return true;
  }

  return false;
}

function quotaExceededPayload(status) {
  return {
    error: 'ai_quota_exceeded',
    message:
      'You have reached the free AI Coach limit. It resets soon, or you can upgrade to Ghost Mode Pro.',
    limit: status.limit,
    used: status.used,
    remaining: 0,
    windowMs: status.windowMs,
    resetsAt: status.resetsAt,
    resetsAtIso: status.resetsAtIso,
  };
}

/**
 * Enforce free AI quota before expensive / chat work.
 * Crisis paths should call this with { skip: true }.
 */
async function enforceAiQuota(req, res, { accountId, skip = false } = {}) {
  if (skip || !QUOTA_ENFORCEMENT) {
    return { enforced: false, allowed: true, pro: false };
  }

  const id = normalizeAccountId(accountId || req.body?.accountId);
  if (!id) {
    // Without an account id we cannot bind durable quota — reject when enforcing.
    res.status(400).json({
      error: 'accountId_required',
      message: 'Sign in so Ghost Mode can apply your free AI message allowance.',
    });
    return { enforced: true, allowed: false, pro: false };
  }

  if (isProRequest(req, id)) {
    return { enforced: true, allowed: true, pro: true, accountId: id };
  }

  const result = await tryConsumeQuota(id);
  if (!result.ok) {
    res.status(400).json({
      error: 'accountId_required',
      message: result.error || 'Invalid account.',
    });
    return { enforced: true, allowed: false, pro: false };
  }

  if (!result.allowed) {
    res.status(429).json(quotaExceededPayload(result));
    return { enforced: true, allowed: false, pro: false, status: result };
  }

  return {
    enforced: true,
    allowed: true,
    pro: false,
    accountId: id,
    status: result,
  };
}

async function readAiQuota(req) {
  const id = normalizeAccountId(req.query.accountId || req.body?.accountId);
  if (!id) {
    return { ok: false, error: 'accountId is required' };
  }
  if (isProRequest(req, id)) {
    return {
      ok: true,
      accountId: id,
      pro: true,
      unlimited: true,
      limit: null,
      used: 0,
      remaining: null,
      resetsAt: null,
      resetsAtIso: null,
      allowed: true,
    };
  }
  const status = await getQuotaStatus(id);
  return { ...status, pro: false, unlimited: false };
}

module.exports = {
  enforceAiQuota,
  readAiQuota,
  isProRequest,
  quotaExceededPayload,
};
