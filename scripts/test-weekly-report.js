/**
 * Weekly report, mood trends, Pro pricing constants, daily-plan id filter.
 * Run: node scripts/test-weekly-report.js
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
  const { code } = babel.transformSync(source, {
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

const { buildWeeklyInsight } = loadAppModule('utils/weeklyProgressReport.js');
const { buildMoodTrend } = loadAppModule('utils/moodTrends.js');
const {
  FREE_AI_QUOTA,
  shouldEnforceAiQuota,
  PRO_PRICING,
  ENTITLEMENTS,
} = loadAppModule('config/proEntitlements.js');
const { getMediaFeatureStatus, MUSIC_CATALOG } = loadAppModule(
  'architecture/musicVoice.js'
);
const { uniqueValidIds } = require('../backend/dailyPlanAi');

const insufficient = buildWeeklyInsight({
  journalCount: 0,
  moodCount: 0,
  planActivitiesCompleted: 0,
  plansCompleted: 0,
  streakDay: 2,
  topMood: null,
});
assert.strictEqual(insufficient.tone, 'insufficient');

const strong = buildWeeklyInsight({
  journalCount: 1,
  moodCount: 1,
  planActivitiesCompleted: 12,
  plansCompleted: 4,
  streakDay: 20,
  topMood: { label: 'Healing' },
});
assert.strictEqual(strong.tone, 'strong');
assert.ok(!/diagnos(is|e)|prescribe|clinical treatment/i.test(strong.body));

const ref = new Date('2026-11-21T12:00:00');
const trend = buildMoodTrend(
  [
    { mood: 'anxious', createdAt: '2026-11-21T10:00:00.000Z' },
    { mood: 'healing', createdAt: '2026-11-20T10:00:00.000Z' },
  ],
  7,
  ref
);
assert.strictEqual(trend.total, 2);
assert.strictEqual(trend.hasData, true);
assert.strictEqual(trend.series.length, 7);

assert.strictEqual(FREE_AI_QUOTA.limit, 10);
assert.strictEqual(FREE_AI_QUOTA.windowMs, 5 * 60 * 60 * 1000);
assert.strictEqual(PRO_PRICING.monthly.priceUsd, 4.99);
assert.strictEqual(PRO_PRICING.yearly.priceUsd, 39.99);
assert.strictEqual(shouldEnforceAiQuota(false), false);
assert.strictEqual(ENTITLEMENTS.CRISIS_SOS.free, true);
assert.strictEqual(ENTITLEMENTS.DAILY_RECOVERY_PLAN.free, true);

assert.deepStrictEqual(
  uniqueValidIds(['a', 'b', 'hack', 'a'], new Set(['a', 'b'])),
  ['a', 'b']
);

const media = getMediaFeatureStatus();
assert.strictEqual(media.musicEnabled, false);
assert.strictEqual(media.voiceEnabled, false);
assert.strictEqual(MUSIC_CATALOG.length, 0);

console.log('test-weekly-report: ok');
