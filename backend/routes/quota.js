const express = require('express');
const { QUOTA_ENFORCEMENT, FREE_LIMIT, WINDOW_MS } = require('../quotaConfig');
const { readAiQuota } = require('../quotaGuard');

const router = express.Router();

/**
 * GET /quota?accountId=local:user@example.com
 * Returns remaining free AI messages for the rolling window.
 */
router.get('/quota', async (req, res) => {
  try {
    const status = await readAiQuota(req);
    if (!status.ok) {
      return res.status(400).json({ error: status.error || 'Invalid request' });
    }

    return res.json({
      ok: true,
      enforcement: QUOTA_ENFORCEMENT,
      freeLimit: FREE_LIMIT,
      windowMs: WINDOW_MS,
      ...status,
    });
  } catch {
    return res.status(500).json({ error: 'Could not read AI quota.' });
  }
});

module.exports = router;
