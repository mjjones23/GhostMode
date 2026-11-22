const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const syncEnabled = ['1', 'true', 'yes', 'on'].includes(
  String(process.env.CLOUD_SYNC_ENABLED || '').toLowerCase()
);

const syncDir = process.env.ACCOUNT_SYNC_DATA_DIR
  ? path.resolve(process.env.ACCOUNT_SYNC_DATA_DIR)
  : path.join(__dirname, '..', 'data', 'account-sync');

/**
 * POST /account/sync
 * Account-linked snapshot upload. Disabled unless CLOUD_SYNC_ENABLED=true on server.
 * Production migrations must stay off until reviewed.
 */
router.post('/account/sync', (req, res) => {
  if (!syncEnabled) {
    return res.status(503).json({
      error: 'cloud_sync_disabled',
      message: 'Account sync is disabled on this server (safe default).',
    });
  }

  const accountId = String(req.body?.accountId || '')
    .trim()
    .toLowerCase()
    .slice(0, 120);
  const payload = req.body?.payload;

  if (!accountId || !/^[a-z0-9:@._+-]+$/i.test(accountId)) {
    return res.status(400).json({ error: 'Valid accountId is required' });
  }
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ error: 'payload object is required' });
  }
  if (payload.data?.password || payload.data?.passwordHash || payload.data?.userProfile) {
    return res.status(400).json({ error: 'Credentials are not allowed in sync payloads' });
  }

  if (!fs.existsSync(syncDir)) fs.mkdirSync(syncDir, { recursive: true });
  const filePath = path.join(syncDir, `${accountId.replace(/[:@]/g, '_')}.json`);
  fs.writeFileSync(
    filePath,
    JSON.stringify(
      {
        accountId,
        savedAt: new Date().toISOString(),
        payload,
      },
      null,
      2
    ),
    'utf8'
  );

  return res.json({ ok: true, saved: true });
});

module.exports = router;
