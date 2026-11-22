/**
 * Server-verified Pro entitlements (Batch 2).
 * Durable JSON file — mount a Railway volume for production durability.
 * Live App Store / RevenueCat webhooks can update this map later.
 */

const fs = require('fs');
const path = require('path');

const storeDir = process.env.ENTITLEMENT_DATA_DIR
  ? path.resolve(process.env.ENTITLEMENT_DATA_DIR)
  : path.join(__dirname, 'data');
const storePath = path.join(storeDir, 'entitlements.json');
const tmpPath = `${storePath}.tmp`;

function ensureDir() {
  if (!fs.existsSync(storeDir)) fs.mkdirSync(storeDir, { recursive: true });
}

function readStore() {
  ensureDir();
  try {
    if (!fs.existsSync(storePath)) return { accounts: {} };
    const parsed = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    return {
      accounts:
        parsed?.accounts && typeof parsed.accounts === 'object'
          ? parsed.accounts
          : {},
    };
  } catch {
    return { accounts: {} };
  }
}

function writeStore(store) {
  ensureDir();
  fs.writeFileSync(
    tmpPath,
    JSON.stringify(
      { updatedAt: new Date().toISOString(), accounts: store.accounts || {} },
      null,
      2
    ),
    'utf8'
  );
  fs.renameSync(tmpPath, storePath);
}

function normalizeAccountId(accountId) {
  const id = String(accountId || '')
    .trim()
    .toLowerCase()
    .slice(0, 120);
  if (!id || !/^[a-z0-9:@._+-]+$/i.test(id)) return null;
  return id;
}

function getEntitlement(accountId) {
  const id = normalizeAccountId(accountId);
  if (!id) return { ok: false, error: 'accountId is required' };
  const row = readStore().accounts[id] || null;
  const active = Boolean(row?.active) && (!row.expiresAt || Date.parse(row.expiresAt) > Date.now());
  return {
    ok: true,
    accountId: id,
    active,
    productId: row?.productId || null,
    source: row?.source || null,
    expiresAt: row?.expiresAt || null,
  };
}

function setEntitlement(accountId, { active, productId, source, expiresAt } = {}) {
  const id = normalizeAccountId(accountId);
  if (!id) return { ok: false, error: 'accountId is required' };
  const store = readStore();
  store.accounts[id] = {
    active: Boolean(active),
    productId: productId || null,
    source: source || 'manual',
    expiresAt: expiresAt || null,
    updatedAt: new Date().toISOString(),
  };
  writeStore(store);
  return { ok: true, ...getEntitlement(id) };
}

module.exports = {
  getEntitlement,
  setEntitlement,
  normalizeAccountId,
  storePath,
};
