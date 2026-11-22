const express = require('express');
const { getEntitlement, setEntitlement } = require('../entitlementStore');
const { FREE_LIMIT, WINDOW_MS } = require('../quotaConfig');

const router = express.Router();

const PRO_LIMIT = Number.parseInt(process.env.AI_PRO_MESSAGE_LIMIT || '200', 10) || 200;

/**
 * GET /entitlements?accountId=...
 * Server-verified Pro status used by the app / quota guard.
 */
router.get('/entitlements', (req, res) => {
  const status = getEntitlement(req.query.accountId);
  if (!status.ok) return res.status(400).json(status);

  return res.json({
    ok: true,
    ...status,
    quotas: {
      free: { limit: FREE_LIMIT, windowMs: WINDOW_MS },
      pro: { limit: PRO_LIMIT, windowMs: WINDOW_MS },
    },
  });
});

/**
 * POST /entitlements/revenuecat-webhook
 * Prep endpoint for RevenueCat → server entitlement sync.
 * Rejects unless REVENUECAT_WEBHOOK_SECRET matches.
 * Does NOT enable live purchases by itself.
 */
router.post('/entitlements/revenuecat-webhook', (req, res) => {
  const secret = String(process.env.REVENUECAT_WEBHOOK_SECRET || '').trim();
  if (!secret) {
    return res.status(503).json({
      error: 'webhook_disabled',
      message: 'RevenueCat webhook secret is not configured.',
    });
  }

  const header = String(req.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (header !== secret) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const event = req.body?.event || req.body || {};
  const appUserId = event.app_user_id || event.appUserId || req.body?.app_user_id;
  const type = String(event.type || event.event_type || '').toUpperCase();
  const productId = event.product_id || event.productId || null;

  if (!appUserId) {
    return res.status(400).json({ error: 'app_user_id required' });
  }

  const activates = [
    'INITIAL_PURCHASE',
    'RENEWAL',
    'UNCANCELLATION',
    'PRODUCT_CHANGE',
    'NON_RENEWING_PURCHASE',
  ].includes(type);
  const deactivates = ['EXPIRATION', 'CANCELLATION'].includes(type);

  if (activates) {
    setEntitlement(appUserId, {
      active: true,
      productId,
      source: 'revenuecat',
      expiresAt: event.expiration_at_ms
        ? new Date(Number(event.expiration_at_ms)).toISOString()
        : null,
    });
  } else if (deactivates) {
    setEntitlement(appUserId, {
      active: false,
      productId,
      source: 'revenuecat',
      expiresAt: new Date().toISOString(),
    });
  }

  return res.json({ ok: true, handled: Boolean(activates || deactivates), type });
});

module.exports = router;
