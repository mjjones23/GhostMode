/**
 * Durable account-linked AI quota store.
 *
 * Uses an atomic JSON file under backend/data (or QUOTA_DATA_DIR).
 * Mount a Railway volume on that path for durability across redeploys.
 * Concurrent requests for the same account are serialized in-process.
 */

const fs = require('fs');
const path = require('path');
const { FREE_LIMIT, WINDOW_MS, DATA_DIR } = require('./quotaConfig');

const storeDir = DATA_DIR
  ? path.resolve(DATA_DIR)
  : path.join(__dirname, 'data');
const storePath = path.join(storeDir, 'ai-quotas.json');
const tmpPath = `${storePath}.tmp`;

/** @type {Map<string, Promise<unknown>>} */
const accountLocks = new Map();

function ensureDir() {
  if (!fs.existsSync(storeDir)) {
    fs.mkdirSync(storeDir, { recursive: true });
  }
}

function readStoreSync() {
  ensureDir();
  try {
    if (!fs.existsSync(storePath)) return { accounts: {} };
    const raw = fs.readFileSync(storePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { accounts: {} };
    }
    return {
      accounts:
        parsed.accounts && typeof parsed.accounts === 'object'
          ? parsed.accounts
          : {},
    };
  } catch {
    return { accounts: {} };
  }
}

function writeStoreSync(store) {
  ensureDir();
  const payload = JSON.stringify(
    {
      updatedAt: new Date().toISOString(),
      accounts: store.accounts || {},
    },
    null,
    2
  );
  fs.writeFileSync(tmpPath, payload, 'utf8');
  fs.renameSync(tmpPath, storePath);
}

function normalizeAccountId(accountId) {
  const id = String(accountId || '')
    .trim()
    .toLowerCase()
    .slice(0, 120);
  if (!id) return null;
  // Local auth uses local:email — allow alphanumerics, @ . : _ -
  if (!/^[a-z0-9:@._+-]+$/i.test(id)) return null;
  return id;
}

function pruneTimestamps(timestamps, now, windowMs = WINDOW_MS) {
  const cutoff = now - windowMs;
  return (Array.isArray(timestamps) ? timestamps : [])
    .map((t) => Number(t))
    .filter((t) => Number.isFinite(t) && t >= cutoff)
    .sort((a, b) => a - b);
}

function withAccountLock(accountId, task) {
  const previous = accountLocks.get(accountId) || Promise.resolve();
  const run = previous.then(task, task);
  accountLocks.set(
    accountId,
    run.then(
      () => undefined,
      () => undefined
    )
  );
  return run;
}

function buildStatus(timestamps, now, limit = FREE_LIMIT, windowMs = WINDOW_MS) {
  const used = timestamps.length;
  const remaining = Math.max(0, limit - used);
  const oldest = timestamps[0] || null;
  const resetsAt = used >= limit && oldest ? oldest + windowMs : null;

  return {
    limit,
    windowMs,
    used,
    remaining,
    resetsAt,
    resetsAtIso: resetsAt ? new Date(resetsAt).toISOString() : null,
    allowed: remaining > 0,
  };
}

/**
 * Peek quota without consuming a slot.
 */
async function getQuotaStatus(accountId) {
  const id = normalizeAccountId(accountId);
  if (!id) {
    return { ok: false, error: 'accountId is required' };
  }

  return withAccountLock(id, async () => {
    const now = Date.now();
    const store = readStoreSync();
    const timestamps = pruneTimestamps(store.accounts[id]?.timestamps, now);
    if (
      store.accounts[id] &&
      timestamps.length !== (store.accounts[id].timestamps || []).length
    ) {
      store.accounts[id] = {
        timestamps,
        updatedAt: new Date().toISOString(),
      };
      writeStoreSync(store);
    }
    return { ok: true, accountId: id, ...buildStatus(timestamps, now) };
  });
}

/**
 * Atomically consume one free message if under the limit.
 * Returns { allowed: false, ...status } without incrementing when blocked.
 */
async function tryConsumeQuota(accountId, { limit = FREE_LIMIT, windowMs = WINDOW_MS } = {}) {
  const id = normalizeAccountId(accountId);
  if (!id) {
    return { ok: false, error: 'accountId is required', allowed: false };
  }

  const effectiveLimit = Number.isFinite(limit) && limit > 0 ? limit : FREE_LIMIT;
  const effectiveWindow = Number.isFinite(windowMs) && windowMs > 0 ? windowMs : WINDOW_MS;

  return withAccountLock(id, async () => {
    const now = Date.now();
    const store = readStoreSync();
    const timestamps = pruneTimestamps(
      store.accounts[id]?.timestamps,
      now,
      effectiveWindow
    );
    const status = buildStatus(timestamps, now, effectiveLimit, effectiveWindow);

    if (!status.allowed) {
      return { ok: true, accountId: id, consumed: false, ...status };
    }

    const next = [...timestamps, now];
    store.accounts[id] = {
      timestamps: next,
      updatedAt: new Date().toISOString(),
    };
    writeStoreSync(store);

    const after = buildStatus(next, now, effectiveLimit, effectiveWindow);
    return {
      ok: true,
      accountId: id,
      consumed: true,
      // This request was accepted even if the window is now fully used.
      allowed: true,
      limit: after.limit,
      windowMs: after.windowMs,
      used: after.used,
      remaining: after.remaining,
      resetsAt: after.resetsAt,
      resetsAtIso: after.resetsAtIso,
    };
  });
}

/** Test helper — clears one account or the whole store. */
async function resetQuotaStore(accountId = null) {
  if (!accountId) {
    ensureDir();
    writeStoreSync({ accounts: {} });
    return { ok: true };
  }

  const id = normalizeAccountId(accountId);
  if (!id) return { ok: false, error: 'invalid accountId' };

  return withAccountLock(id, async () => {
    const store = readStoreSync();
    delete store.accounts[id];
    writeStoreSync(store);
    return { ok: true };
  });
}

module.exports = {
  normalizeAccountId,
  getQuotaStatus,
  tryConsumeQuota,
  resetQuotaStore,
  pruneTimestamps,
  buildStatus,
  storePath,
};
