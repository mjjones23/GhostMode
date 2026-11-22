const assert = require('assert');
const fs = require('fs');
const path = require('path');

process.env.QUOTA_ENFORCEMENT = 'true';
process.env.AI_FREE_MESSAGE_LIMIT = '3';
process.env.AI_FREE_WINDOW_MS = String(5 * 60 * 60 * 1000);
process.env.QUOTA_DATA_DIR = path.join(__dirname, 'data-test-quota');

const {
  tryConsumeQuota,
  getQuotaStatus,
  resetQuotaStore,
  normalizeAccountId,
  pruneTimestamps,
  buildStatus,
} = require('./quotaStore');
const { enforceAiQuota } = require('./quotaGuard');

async function run() {
  await resetQuotaStore();

  assert.strictEqual(normalizeAccountId('local:User@Example.com'), 'local:user@example.com');
  assert.strictEqual(normalizeAccountId('bad id!'), null);

  const now = Date.now();
  const pruned = pruneTimestamps([now - 10, now - 999999999], now, 1000);
  assert.strictEqual(pruned.length, 1);

  const accountId = 'local:quota-test@example.com';
  for (let i = 0; i < 3; i += 1) {
    const result = await tryConsumeQuota(accountId);
    assert.strictEqual(result.allowed, true);
    assert.strictEqual(result.consumed, true);
  }

  const blocked = await tryConsumeQuota(accountId);
  assert.strictEqual(blocked.allowed, false);
  assert.strictEqual(blocked.consumed, false);
  assert.ok(blocked.resetsAt);

  const status = await getQuotaStatus(accountId);
  assert.strictEqual(status.remaining, 0);
  assert.strictEqual(status.used, 3);

  // Concurrent requests: only one more slot after reset.
  await resetQuotaStore(accountId);
  const concurrent = await Promise.all([
    tryConsumeQuota(accountId),
    tryConsumeQuota(accountId),
    tryConsumeQuota(accountId),
    tryConsumeQuota(accountId),
  ]);
  const allowed = concurrent.filter((r) => r.allowed).length;
  const denied = concurrent.filter((r) => !r.allowed).length;
  assert.strictEqual(allowed, 3);
  assert.strictEqual(denied, 1);

  const built = buildStatus([now, now + 1], now, 3, 10000);
  assert.strictEqual(built.remaining, 1);
  assert.strictEqual(built.allowed, true);

  // Mock Express req/res for guard.
  let statusCode = 200;
  let payload = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      payload = body;
      return body;
    },
  };
  const req = {
    body: { accountId },
    get() {
      return '';
    },
  };

  await resetQuotaStore(accountId);
  for (let i = 0; i < 3; i += 1) {
    const ok = await enforceAiQuota(req, res, { accountId, skip: false });
    assert.strictEqual(ok.allowed, true);
  }
  const limited = await enforceAiQuota(req, res, { accountId, skip: false });
  assert.strictEqual(limited.allowed, false);
  assert.strictEqual(statusCode, 429);
  assert.strictEqual(payload.error, 'ai_quota_exceeded');

  const skipped = await enforceAiQuota(req, res, { accountId, skip: true });
  assert.strictEqual(skipped.allowed, true);

  // Cleanup test store
  await resetQuotaStore();
  try {
    fs.rmSync(process.env.QUOTA_DATA_DIR, { recursive: true, force: true });
  } catch {
    // ignore
  }

  console.log('test-quota: ok');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
