/**
 * App-side unit tests for AI Coach personalization (no device / Expo).
 * Run from repo root:
 *   node scripts/test-coach-context-app.js
 */
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
  'expo-crypto': { randomUUID: () => 'test-uuid' },
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

const origJs = Module._extensions['.js'];
Module._extensions['.js'] = function (module, filename) {
  const norm = filename.replace(/\\/g, '/');
  if (norm.startsWith(ROOT.replace(/\\/g, '/')) && !norm.includes('/node_modules/')) {
    const src = fs.readFileSync(filename, 'utf8');
    const out = babel.transformSync(src, {
      filename,
      babelrc: false,
      configFile: false,
      plugins: [cjsPlugin],
    });
    module._compile(out.code, filename);
    return;
  }
  return origJs(module, filename);
};

let passed = 0;
let failed = 0;
function check(name, cond, detail) {
  if (cond) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`FAIL  ${name}${detail !== undefined ? ` → ${JSON.stringify(detail)}` : ''}`);
  }
}
function eq(name, actual, expected) {
  check(name, JSON.stringify(actual) === JSON.stringify(expected), { actual, expected });
}

async function main() {
  const {
    buildCoachContextFromData,
    sanitizeCoachContextPayload,
    loadCoachPersonalizationContext,
  } = require(path.join(ROOT, 'utils/coachContext.js'));
  const {
    STORAGE_KEYS,
    saveCoachContextShareEnabled,
    loadCoachContextShareEnabled,
    saveNoContactStart,
    saveMainGoal,
    saveMoodLogs,
    getDailyMoodLogId,
    getTodayDateKey,
  } = require(path.join(ROOT, 'utils/storage.js'));
  const { detectCrisis, CRISIS_REPLY } = require(path.join(ROOT, 'utils/crisisSafety.js'));
  const { fetchCoachReply } = require(path.join(ROOT, 'services/aiService.js'));

  // Default opt-out
  store.clear();
  eq('default share setting is OFF', await loadCoachContextShareEnabled(), false);

  // Opt-in / opt-out builders
  eq(
    'opt-out returns null even with data',
    buildCoachContextFromData({
      optedIn: false,
      streakDay: 10,
      moodId: 'okay',
      recoveryGoal: 'Heal and move on',
    }),
    null
  );

  eq(
    'opt-in builds allowlisted context',
    buildCoachContextFromData({
      optedIn: true,
      streakDay: 10,
      moodId: 'okay',
      recoveryGoal: 'Heal and move on',
    }),
    {
      version: 1,
      streakDay: 10,
      todayMood: 'okay',
      todayMoodLabel: 'Okay',
      recoveryGoal: 'Heal and move on',
    }
  );

  eq(
    'missing mood/goal still returns streak',
    buildCoachContextFromData({
      optedIn: true,
      streakDay: 3,
      moodId: null,
      recoveryGoal: null,
    }),
    { version: 1, streakDay: 3 }
  );

  eq(
    'opt-in with no usable data returns null',
    buildCoachContextFromData({
      optedIn: true,
      streakDay: null,
      moodId: 'not-a-real-mood',
      recoveryGoal: 'Get revenge',
    }),
    null
  );

  eq(
    'sanitize drops journal/email/password',
    sanitizeCoachContextPayload({
      streakDay: 4,
      journal: 'private text',
      email: 'a@b.com',
      password: 'x',
      todayMood: 'strong',
    }),
    {
      version: 1,
      streakDay: 4,
      todayMood: 'strong',
      todayMoodLabel: 'Strong',
    }
  );

  // Async load with storage
  store.clear();
  await saveCoachContextShareEnabled(false);
  await saveNoContactStart(getTodayDateKey());
  await saveMainGoal('Build confidence');
  eq(
    'load context when opted out → null',
    await loadCoachPersonalizationContext(),
    null
  );

  await saveCoachContextShareEnabled(true);
  const today = getTodayDateKey();
  await saveMoodLogs([
    {
      id: getDailyMoodLogId(today),
      mood: 'hurting',
      note: '',
      createdAt: new Date().toISOString(),
    },
  ]);
  store.set(STORAGE_KEYS.DAILY_CHECKINS_MIGRATED, 'true');

  const loaded = await loadCoachPersonalizationContext();
  check('load context when opted in includes streak', loaded?.streakDay === 1);
  check('load context when opted in includes mood', loaded?.todayMood === 'hurting');
  check(
    'load context when opted in includes goal',
    loaded?.recoveryGoal === 'Build confidence'
  );
  check('loaded context has no journal key', !('journal' in (loaded || {})));

  await saveCoachContextShareEnabled(false);
  eq('toggle back off clears sharing', await loadCoachPersonalizationContext(), null);

  // Crisis local path ignores context
  const crisis = await fetchCoachReply({
    userText: 'I want to kill myself',
    chatHistory: [{ sender: 'user', text: 'I want to kill myself' }],
    personalizationContext: {
      streakDay: 20,
      todayMood: 'hurting',
      recoveryGoal: 'Heal and move on',
    },
  });
  check('crisis reply from local detector', crisis.crisis === true);
  check('crisis text is safety copy', crisis.reply === CRISIS_REPLY);
  check('crisis does not claim context used', crisis.contextUsed === false);
  check('detectCrisis helper agrees', detectCrisis('I want to kill myself'));

  // Opt-out: sanitize null → fetch without context field (mock path when offline URL)
  const previousUrl = process.env.EXPO_PUBLIC_COACH_API_URL;
  process.env.EXPO_PUBLIC_COACH_API_URL = '';
  const optedOutReply = await fetchCoachReply({
    userText: 'I miss them',
    chatHistory: [{ id: 'u1', sender: 'user', text: 'I miss them' }],
    personalizationContext: null,
  });
  check('opt-out reply is non-crisis', optedOutReply.crisis === false);
  check('opt-out contextUsed false', optedOutReply.contextUsed === false);
  if (previousUrl === undefined) delete process.env.EXPO_PUBLIC_COACH_API_URL;
  else process.env.EXPO_PUBLIC_COACH_API_URL = previousUrl;

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
