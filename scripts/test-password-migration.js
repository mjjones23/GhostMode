/**
 * Legacy password migration tests (no device, Expo, or network).
 * Run from repo root:
 *   node scripts/test-password-migration.js
 */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Module = require('module');

const ROOT = path.join(__dirname, '..');
const babel = require(path.join(ROOT, 'node_modules/@babel/core'));
const cjsPlugin = require.resolve(
  path.join(ROOT, 'node_modules/@babel/plugin-transform-modules-commonjs')
);

const PROFILE_KEY = '@ghostmode/user_profile';
const SESSION_KEY = '@ghostmode/auth_session';

const store = new Map();
const writes = [];
let failProfileWrites = false;
let failHash = false;

const AsyncStorageMock = {
  getItem: async (key) => (store.has(key) ? store.get(key) : null),
  setItem: async (key, value) => {
    writes.push(key);
    if (failProfileWrites && key === PROFILE_KEY) {
      throw new Error('storage unavailable');
    }
    store.set(key, String(value));
  },
  removeItem: async (key) => {
    store.delete(key);
  },
  multiRemove: async (keys) => keys.forEach((key) => store.delete(key)),
};

const mocks = {
  '@react-native-async-storage/async-storage': {
    __esModule: true,
    default: AsyncStorageMock,
  },
  'expo-crypto': {
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    randomUUID: () => 'test-uuid',
    digestStringAsync: async (_algorithm, value) => {
      if (failHash) throw new Error('hash unavailable');
      return crypto.createHash('sha256').update(String(value), 'utf8').digest('hex');
    },
  },
  'expo-constants': {
    __esModule: true,
    default: { expoConfig: { extra: {} } },
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
const realLog = console.log.bind(console);

function check(name, condition) {
  if (condition) {
    passed += 1;
    realLog(`PASS  ${name}`);
  } else {
    failed += 1;
    realLog(`FAIL  ${name}`);
  }
}

function seedProfile(profile, session) {
  store.set(PROFILE_KEY, JSON.stringify(profile));
  if (session === undefined) store.delete(SESSION_KEY);
  else store.set(SESSION_KEY, session);
}

function readStoredProfile() {
  const raw = store.get(PROFILE_KEY);
  return raw ? JSON.parse(raw) : null;
}

function resetWrites() {
  writes.length = 0;
}

async function main() {
  const {
    loadUserProfile,
    loadLoggedInUser,
    isUserLoggedIn,
    loginLocalUser,
    registerLocalUser,
    logoutLocalUser,
  } = require(path.join(ROOT, 'utils/storage.js'));

  const createdAt = '2024-05-01T12:00:00.000Z';
  const email = 'user@example.com';
  const name = 'Avery';

  seedProfile(
    {
      name,
      email,
      password: '  legacy-secret',
      createdAt,
      theme: 'night',
    },
    'true'
  );
  resetWrites();

  const captured = [];
  const originalLog = console.log;
  const originalInfo = console.info;
  const originalWarn = console.warn;
  const originalError = console.error;
  const capture = (...args) => {
    captured.push(args.map((arg) => String(arg)).join(' '));
  };
  console.log = capture;
  console.info = capture;
  console.warn = capture;
  console.error = capture;

  const loaded = await loadUserProfile();
  const signedIn = await loadLoggedInUser();

  console.log = originalLog;
  console.info = originalInfo;
  console.warn = originalWarn;
  console.error = originalError;

  const migrated = readStoredProfile();
  check('legacy profile gains a hash', typeof migrated.passwordHash === 'string' && migrated.passwordHash.length > 0);
  check('legacy plaintext field is removed', !Object.prototype.hasOwnProperty.call(migrated, 'password'));
  check('legacy name is preserved', migrated.name === name && loaded.name === name);
  check('legacy email is preserved', migrated.email === email);
  check('legacy creation date is preserved', migrated.createdAt === createdAt);
  check('legacy extra fields are preserved', migrated.theme === 'night');
  check('active session stays signed in', (await isUserLoggedIn()) === true);
  check('session value is unchanged', store.get(SESSION_KEY) === 'true');
  check('signed-in user loads without a new login', signedIn?.name === name && signedIn?.email === email);
  check('migration does not rewrite the session', !writes.includes(SESSION_KEY));
  check(
    'migration logs omit the password and hash',
    captured.every((line) => !line.includes('legacy-secret') && !line.includes(migrated.passwordHash))
  );

  const hashAfterFirstLoad = migrated.passwordHash;
  const rawAfterFirstLoad = store.get(PROFILE_KEY);
  resetWrites();
  const second = await loadUserProfile();
  check('second load keeps the same hash', second.passwordHash === hashAfterFirstLoad);
  check('second load does not write storage', writes.length === 0 && store.get(PROFILE_KEY) === rawAfterFirstLoad);

  const wrong = await loginLocalUser({ email, password: 'not-the-password' });
  check('incorrect password is rejected', wrong.ok === false);
  check('incorrect password leaves the hash in place', readStoredProfile().passwordHash === hashAfterFirstLoad);
  check('incorrect password does not restore plaintext', !Object.prototype.hasOwnProperty.call(readStoredProfile(), 'password'));
  check('incorrect password keeps the session', store.get(SESSION_KEY) === 'true');

  const right = await loginLocalUser({ email, password: 'legacy-secret' });
  check('migrated password still signs in', right.ok === true && right.user.email === email);
  check('trimmed legacy password matches login', readStoredProfile().passwordHash === hashAfterFirstLoad);

  seedProfile(
    {
      name: 'Mixed Case',
      email: 'User@Example.com',
      password: 'mixed-secret',
      createdAt,
    },
    'false'
  );
  await loadUserProfile();
  const mixedHash = readStoredProfile().passwordHash;
  const mixedJournalKey = '@ghostmode/journal';
  const mixedMemoriesKey = '@ghostmode/coach_memories';
  const mixedStreakKey = '@ghostmode/no_contact_start';
  const mixedJournalRaw = '[{"id":"j1","text":"kept"}]';
  const mixedMemoriesRaw = '[{"id":"m1","text":"kept"}]';
  const mixedStreakRaw = '2024-01-01';
  store.set(mixedJournalKey, mixedJournalRaw);
  store.set(mixedMemoriesKey, mixedMemoriesRaw);
  store.set(mixedStreakKey, mixedStreakRaw);
  check('mixed-case email is not rewritten', readStoredProfile().email === 'User@Example.com');
  check('mixed-case profile drops plaintext', !Object.prototype.hasOwnProperty.call(readStoredProfile(), 'password'));

  const mixedWrong = await loginLocalUser({
    email: 'User@Example.com',
    password: 'wrong-secret',
  });
  check('mixed-case email rejects an incorrect password', mixedWrong.ok === false);
  check('incorrect mixed-case login keeps the hash', readStoredProfile().passwordHash === mixedHash);
  check('incorrect mixed-case login keeps the email', readStoredProfile().email === 'User@Example.com');
  check('incorrect mixed-case login stays signed out', store.get(SESSION_KEY) === 'false');

  const mixedLower = await loginLocalUser({
    email: 'user@example.com',
    password: 'mixed-secret',
  });
  check(
    'mixed-case legacy email signs in when typed in lowercase',
    mixedLower.ok === true && mixedLower.user.email === 'User@Example.com'
  );
  check('lowercase login keeps the stored email', readStoredProfile().email === 'User@Example.com');
  check('lowercase login keeps the password hash', readStoredProfile().passwordHash === mixedHash);
  check('lowercase login opens the session', store.get(SESSION_KEY) === 'true');

  const mixedUpper = await loginLocalUser({
    email: 'USER@EXAMPLE.COM',
    password: 'mixed-secret',
  });
  check(
    'mixed-case legacy email signs in when typed in capitals',
    mixedUpper.ok === true && mixedUpper.user.email === 'User@Example.com'
  );

  seedProfile(
    {
      name: 'Mixed Case',
      email: 'User@Example.com',
      passwordHash: mixedHash,
      createdAt,
    },
    'false'
  );
  store.set(mixedJournalKey, mixedJournalRaw);
  store.set(mixedMemoriesKey, mixedMemoriesRaw);
  store.set(mixedStreakKey, mixedStreakRaw);
  const mixedStored = await loginLocalUser({
    email: '  user@example.com  ',
    password: 'mixed-secret',
  });
  check('stored hash with a mixed-case email signs in', mixedStored.ok === true);
  check('hash-only login does not rewrite the email', readStoredProfile().email === 'User@Example.com');
  check('hash-only login does not rewrite the hash', readStoredProfile().passwordHash === mixedHash);
  const mixedOther = await loginLocalUser({
    email: 'other@example.com',
    password: 'mixed-secret',
  });
  check('a different email is rejected for the mixed-case account', mixedOther.ok === false);
  check('rejected email keeps the mixed-case account', readStoredProfile().email === 'User@Example.com' && readStoredProfile().passwordHash === mixedHash);
  check('mixed-case login leaves the journal in place', store.get(mixedJournalKey) === mixedJournalRaw);
  check('mixed-case login leaves memories in place', store.get(mixedMemoriesKey) === mixedMemoriesRaw);
  check('mixed-case login leaves the streak in place', store.get(mixedStreakKey) === mixedStreakRaw);

  const shortCreated = '2023-01-02T00:00:00.000Z';
  seedProfile(
    { name: 'Blake', email: 'blake@example.com', password: 'abcd', createdAt: shortCreated },
    'false'
  );
  await loadUserProfile();
  const shortLogin = await loginLocalUser({
    email: 'blake@example.com',
    password: 'abcd',
  });
  check('shorter legacy password still signs in', shortLogin.ok === true);
  check('short legacy password is no longer stored', !Object.prototype.hasOwnProperty.call(readStoredProfile(), 'password'));

  const keptHash = 'kept-hash-not-from-plaintext';
  seedProfile(
    {
      name: 'Casey',
      email: 'casey@example.com',
      password: 'plaintext-should-not-win',
      passwordHash: keptHash,
      createdAt,
    },
    'true'
  );
  resetWrites();
  const kept = await loadUserProfile();
  check('existing hash is preserved', kept.passwordHash === keptHash && readStoredProfile().passwordHash === keptHash);
  check('plaintext is removed when a hash already exists', !Object.prototype.hasOwnProperty.call(readStoredProfile(), 'password'));
  check('existing-hash migration keeps the session', store.get(SESSION_KEY) === 'true');
  const plaintextLogin = await loginLocalUser({
    email: 'casey@example.com',
    password: 'plaintext-should-not-win',
  });
  check('removed plaintext cannot be used to sign in', plaintextLogin.ok === false);
  check('preserved hash remains after a bad login', readStoredProfile().passwordHash === keptHash);

  store.delete(PROFILE_KEY);
  store.delete(SESSION_KEY);
  const registered = await registerLocalUser({
    name: 'Drew',
    email: 'drew@example.com',
    password: 'correct-horse',
  });
  check('new account signs in', registered.ok === true);
  const registeredStored = readStoredProfile();
  const registeredHash = registeredStored.passwordHash;
  check('new account stores a hash only', !Object.prototype.hasOwnProperty.call(registeredStored, 'password'));
  registeredStored.password = 'later-plaintext';
  store.set(PROFILE_KEY, JSON.stringify(registeredStored));
  store.set(SESSION_KEY, 'true');
  const reread = await loadUserProfile();
  check('added plaintext does not replace the real hash', reread.passwordHash === registeredHash);
  check('added plaintext is removed', !Object.prototype.hasOwnProperty.call(readStoredProfile(), 'password'));
  const registeredLogin = await loginLocalUser({
    email: 'drew@example.com',
    password: 'correct-horse',
  });
  check('original password still signs in', registeredLogin.ok === true);
  await logoutLocalUser();
  check('logout clears the session only', store.get(SESSION_KEY) === 'false' && readStoredProfile().passwordHash === registeredHash);

  seedProfile(
    { name: 'Eden', email: 'eden@example.com', passwordHash: registeredHash, createdAt },
    'true'
  );
  const beforeHashOnly = store.get(PROFILE_KEY);
  resetWrites();
  await loadUserProfile();
  check('hash-only profile is not rewritten', writes.length === 0 && store.get(PROFILE_KEY) === beforeHashOnly);

  const originalLegacy = {
    name: 'Finn',
    email: 'finn@example.com',
    password: 'keep-me-if-save-fails',
    createdAt,
  };
  seedProfile(originalLegacy, 'true');
  const originalRaw = store.get(PROFILE_KEY);
  failProfileWrites = true;
  resetWrites();
  let loadFailed = false;
  try {
    await loadUserProfile();
  } catch {
    loadFailed = true;
  }
  check('failed save does not throw', loadFailed === false);
  check('failed save keeps the original record', store.get(PROFILE_KEY) === originalRaw);
  check('failed save keeps the plaintext', readStoredProfile().password === 'keep-me-if-save-fails');
  check('failed save does not add a hash', readStoredProfile().passwordHash === undefined);
  check('failed save keeps the session', store.get(SESSION_KEY) === 'true');

  const loginDuringFailure = await loginLocalUser({
    email: 'finn@example.com',
    password: 'keep-me-if-save-fails',
  });
  check('login still works when the hash cannot be saved', loginDuringFailure.ok === true);
  check('failed login migration keeps the original plaintext', readStoredProfile().password === 'keep-me-if-save-fails');
  failProfileWrites = false;
  await loadUserProfile();
  check('migration succeeds after storage recovers', !Object.prototype.hasOwnProperty.call(readStoredProfile(), 'password'));
  check('recovered profile keeps the name', readStoredProfile().name === 'Finn');
  check('recovered profile keeps the email', readStoredProfile().email === 'finn@example.com');
  check('recovered profile keeps the creation date', readStoredProfile().createdAt === createdAt);

  seedProfile(
    { name: 'Gray', email: 'gray@example.com', password: 'hash-failed-secret', createdAt },
    'true'
  );
  const beforeHashFailure = store.get(PROFILE_KEY);
  failHash = true;
  let hashLoadFailed = false;
  try {
    await loadUserProfile();
  } catch {
    hashLoadFailed = true;
  }
  failHash = false;
  check('failed hash does not throw', hashLoadFailed === false);
  check('failed hash does not replace the record', store.get(PROFILE_KEY) === beforeHashFailure);
  await loadUserProfile();
  check('hash failure retries on the next load', !Object.prototype.hasOwnProperty.call(readStoredProfile(), 'password'));
  check('retried profile keeps the name', readStoredProfile().name === 'Gray');

  const journalKey = '@ghostmode/journal';
  const journalRaw = JSON.stringify([
    { id: 'j1', text: 'private journal stays', createdAt },
  ]);
  const reviewEmail = ['ghostmode', 'apple', 'review'].join('.') + '@gmail.com';
  store.set(journalKey, journalRaw);
  store.delete(PROFILE_KEY);
  store.delete(SESSION_KEY);
  const reviewerSignup = await registerLocalUser({
    name: 'Reviewer',
    email: reviewEmail,
    password: 'ordinary-pass',
  });
  check('signup accepts any email through the normal path', reviewerSignup.ok === true);
  check('signup does not mark a review account', readStoredProfile().isAppReviewAccount !== true);
  check('signup stores a hash and not a plaintext password', typeof readStoredProfile().passwordHash === 'string' && !Object.prototype.hasOwnProperty.call(readStoredProfile(), 'password'));
  check('signup leaves existing journal data in place', store.get(journalKey) === journalRaw);
  check('signup opens a session', (await isUserLoggedIn()) === true);
  const sessionUser = await loadLoggedInUser();
  check('existing session loads the new account', sessionUser?.email === reviewEmail);

  const duplicate = await registerLocalUser({
    name: 'Someone Else',
    email: 'other@example.com',
    password: 'ordinary-pass',
  });
  check('second signup does not replace the account', duplicate.ok === false);
  check('second signup keeps the original profile and journal', readStoredProfile().email === reviewEmail && store.get(journalKey) === journalRaw);

  await logoutLocalUser();
  check('logout keeps the account and journal', store.get(SESSION_KEY) === 'false' && store.get(journalKey) === journalRaw);
  const wrongReviewLogin = await loginLocalUser({
    email: reviewEmail,
    password: 'wrong-password',
  });
  check('incorrect password stays rejected', wrongReviewLogin.ok === false && store.get(SESSION_KEY) === 'false');
  const reviewLogin = await loginLocalUser({
    email: reviewEmail,
    password: 'ordinary-pass',
  });
  check('normal login works for that account', reviewLogin.ok === true);

  const { PREMIUM_ENABLED } = require(path.join(ROOT, 'config/premiumFlags.js'));
  check('premium gating stays off', PREMIUM_ENABLED === false);
  const featuresOpen = !PREMIUM_ENABLED || false || false;
  check('a normal account can use features while premium gating is off', featuresOpen === true);
  const premiumSrc = fs.readFileSync(path.join(ROOT, 'context', 'PremiumContext.js'), 'utf8');
  check('premium context has no review bypass', !premiumSrc.includes('reviewPremium') && !premiumSrc.includes('appReview'));

  const forbidden = [
    'APP_REVIEW_PASSWORD',
    'APP_REVIEW_PREMIUM_EMAIL',
    'ensureAppReviewLocalAccount',
    'isAppReviewCredentials',
    'isAppReviewPremiumEmail',
    'config/appReview',
    'config\\appReview',
    reviewEmail,
  ];
  const hits = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.(js|jsx|json|md)$/.test(entry.name)) continue;
      if (path.resolve(full) === path.resolve(__filename)) continue;
      const text = fs.readFileSync(full, 'utf8');
      if (forbidden.some((token) => text.includes(token))) hits.push(entry.name);
    }
  }
  walk(ROOT);
  check('review credential file is gone', !fs.existsSync(path.join(ROOT, 'config', 'appReview.js')));
  check('active source has no review credential markers', hits.length === 0);

  realLog(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
