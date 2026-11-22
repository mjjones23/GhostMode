/**
 * Batch 2 unit tests: cloud migration safety, music catalog, entitlements.
 * Run: node scripts/test-batch2-cloud-music.js
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
  'expo-constants': {
    __esModule: true,
    default: { expoConfig: { extra: { coachApiUrl: '' } } },
  },
  'expo-audio': {
    createAudioPlayer: () => ({ play() {}, pause() {}, remove() {}, loop: false }),
    setAudioModeAsync: async () => {},
    requestRecordingPermissionsAsync: async () => ({ granted: false }),
    AudioModule: {
      getRecordingPermissionsAsync: async () => ({ granted: false }),
    },
    RecordingPresets: { HIGH_QUALITY: {} },
  },
};

const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (mocks[request]) return mocks[request];
  return origLoad.call(this, request, parent, isMain);
};

const cache = new Map();
function loadAppModule(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  if (cache.has(normalized)) return cache.get(normalized);
  const fullPath = path.join(ROOT, relPath);
  const source = fs.readFileSync(fullPath, 'utf8');
  // Strip Metro asset requires for Node tests.
  const rewritten = source.replace(
    /require\(\s*['"][^'"]+\.(wav|mp3|m4a)['"]\s*\)/g,
    '1'
  );
  const { code } = babel.transformSync(rewritten, {
    filename: fullPath,
    plugins: [cjsPlugin],
    babelrc: false,
    configFile: false,
  });
  const mod = { exports: {} };
  cache.set(normalized, mod.exports);
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
  cache.set(normalized, mod.exports);
  return mod.exports;
}

async function run() {
  const cloudFlags = loadAppModule('config/cloudFlags.js');
  assert.strictEqual(cloudFlags.CLOUD_AUTH_ENABLED, false);
  assert.strictEqual(cloudFlags.CLOUD_SYNC_ENABLED, false);
  assert.strictEqual(cloudFlags.CLOUD_MIGRATION_ENABLED, false);

  const migration = loadAppModule('utils/cloudMigration.js');
  const status = migration.getMigrationStatus();
  assert.strictEqual(status.productionSafe, true);

  store.clear();
  const dry = await migration.dryRunLocalToCloudMigration('local:test@example.com');
  assert.strictEqual(dry.ok, true);
  assert.strictEqual(dry.wouldWrite, false);
  assert.strictEqual(dry.migrationEnabled, false);

  const blocked = await migration.migrateLocalDataToCloud({
    accountId: 'local:test@example.com',
    uploader: async () => ({ written: true }),
  });
  assert.strictEqual(blocked.skipped, true);

  const invalid = migration.validateCloudPayload({
    schemaVersion: 1,
    data: { passwordHash: 'nope' },
  });
  assert.strictEqual(invalid.ok, false);

  const merged = migration.mergeCloudIntoLocal(
    [{ id: '1', text: 'local' }],
    [
      { id: '1', text: 'cloud' },
      { id: '2', text: 'new' },
    ]
  );
  assert.strictEqual(merged.find((x) => x.id === '1').text, 'local');
  assert.strictEqual(merged.length, 2);

  const catalog = loadAppModule('content/musicCatalog.js');
  assert.strictEqual(catalog.MUSIC_CATEGORIES.length, 6);
  const ids = catalog.MUSIC_CATEGORIES.map((c) => c.id).sort();
  assert.deepStrictEqual(ids, [
    'focus',
    'motivation',
    'ocean',
    'rain',
    'relaxation',
    'sleep',
  ]);
  assert.ok(catalog.MUSIC_TRACKS.length >= 6);
  catalog.MUSIC_TRACKS.forEach((track) => {
    assert.ok(track.license === 'original' || track.license === 'licensed');
    assert.ok(track.source != null);
  });

  const entitlements = loadAppModule('config/proEntitlements.js');
  assert.strictEqual(entitlements.FREE_AI_QUOTA.limit, 10);
  assert.strictEqual(entitlements.PRO_AI_QUOTA.limit, 200);
  assert.strictEqual(entitlements.PRO_PRICING.monthly.priceUsd, 4.99);
  assert.strictEqual(entitlements.PRO_PRICING.yearly.priceUsd, 39.99);

  const { setEntitlement, getEntitlement } = require('../backend/entitlementStore');
  const accountId = 'local:batch2-pro@example.com';
  setEntitlement(accountId, {
    active: true,
    productId: 'ghost_yearly',
    source: 'test',
  });
  const ent = getEntitlement(accountId);
  assert.strictEqual(ent.active, true);

  const voice = loadAppModule('services/voiceCoachService.js');
  assert.strictEqual(voice.VOICE_MAX_SECONDS, 45);
  assert.ok(voice.VOICE_PRIVACY_NOTICE.includes('consent'));

  console.log('test-batch2-cloud-music: ok');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
