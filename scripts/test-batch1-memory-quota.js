/**
 * Batch 1: memory update + AI quota client helpers.
 * Run: node scripts/test-batch1-memory-quota.js
 */
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const Module = require('module');

const ROOT = path.join(__dirname, '..');
const babel = require(path.join(ROOT, 'node_modules/@babel/core'));
const cjsPlugin = require.resolve(
  path.join(ROOT, 'node_modules/@babel/plugin-transform-modules-commonjs')
);

const store = new Map();
const AsyncStorageMock = {
  getItem: async (k) => (store.has(k) ? store.get(k) : null),
  setItem: async (k, v) => void store.set(k, String(v)),
  removeItem: async (k) => void store.delete(k),
  multiRemove: async (ks) => ks.forEach((k) => store.delete(k)),
};

const mocks = {
  '@react-native-async-storage/async-storage': {
    __esModule: true,
    default: AsyncStorageMock,
  },
  'expo-crypto': {
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    digestStringAsync: async (_alg, value) => `hash:${value}`,
  },
};

const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (mocks[request]) return mocks[request];
  return origLoad.call(this, request, parent, isMain);
};

function loadAppModule(relPath) {
  const fullPath = path.join(ROOT, relPath);
  const source = fs.readFileSync(fullPath, 'utf8');
  const { code } = babel.transformSync(source, {
    filename: fullPath,
    plugins: [cjsPlugin],
    babelrc: false,
    configFile: false,
  });
  const mod = { exports: {} };
  const compiled = new Function(
    'require',
    'module',
    'exports',
    '__dirname',
    '__filename',
    code
  );
  const localRequire = (request) => {
    if (request.startsWith('.')) {
      let resolved = path.resolve(path.dirname(fullPath), request);
      if (!resolved.endsWith('.js')) resolved = `${resolved}.js`;
      if (fs.existsSync(resolved)) {
        return loadAppModule(path.relative(ROOT, resolved));
      }
    }
    return require(request);
  };
  compiled(localRequire, mod, mod.exports, path.dirname(fullPath), fullPath);
  return mod.exports;
}

async function run() {
  store.clear();
  const storage = loadAppModule('utils/storage.js');
  const { parseQuotaExceededResponse, buildQuotaLimitCopy, clientShouldEnforceQuota } =
    loadAppModule('utils/aiQuota.js');

  const added = await storage.addCoachMemory('I prefer short replies');
  assert.strictEqual(added.ok, true);
  assert.strictEqual(added.memories.length, 1);

  const updated = await storage.updateCoachMemory(
    added.memories[0].id,
    'I prefer calm, short replies'
  );
  assert.strictEqual(updated.ok, true);
  assert.strictEqual(updated.memories[0].text, 'I prefer calm, short replies');

  const rejected = await storage.updateCoachMemory(
    added.memories[0].id,
    'password is secret'
  );
  assert.strictEqual(rejected.ok, false);

  await storage.clearMoodLogs();
  assert.deepStrictEqual(await storage.loadMoodLogs(), []);

  const quota = parseQuotaExceededResponse(
    {
      error: 'ai_quota_exceeded',
      limit: 10,
      used: 10,
      resetsAt: Date.now() + 1000,
      resetsAtIso: new Date(Date.now() + 1000).toISOString(),
    },
    429
  );
  assert.ok(quota);
  assert.strictEqual(quota.remaining, 0);
  const copy = buildQuotaLimitCopy(quota);
  assert.ok(copy.title.includes('limit'));
  assert.strictEqual(clientShouldEnforceQuota(false), false);

  console.log('test-batch1-memory-quota: ok');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
