const express = require('express');
const { rankDailyPlanActivities } = require('../dailyPlanAi');

const router = express.Router();

/**
 * POST /daily-plan/rank
 * Optional AI ranking over a client-provided catalog id list.
 * Never invents activities. Client must fall back to local rules on failure.
 */
router.post('/daily-plan/rank', async (req, res) => {
  try {
    const candidateIds = req.body?.candidateIds;
    const context = req.body?.context;

    if (!Array.isArray(candidateIds) || candidateIds.length < 3) {
      return res.status(400).json({
        ok: false,
        error: 'candidateIds array with at least 3 ids is required',
      });
    }

    // Cap payload size — catalog is small; reject oversized lists.
    if (candidateIds.length > 80) {
      return res.status(400).json({ ok: false, error: 'Too many candidateIds' });
    }

    const result = await rankDailyPlanActivities({ candidateIds, context });
    if (!result.ok) {
      return res.json({
        ok: false,
        source: result.source || 'fallback',
        activityIds: null,
      });
    }

    return res.json({
      ok: true,
      source: result.source,
      activityIds: result.activityIds,
    });
  } catch {
    return res.json({
      ok: false,
      source: 'handler_error',
      activityIds: null,
    });
  }
});

module.exports = router;
