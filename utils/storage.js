import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { CHECKIN_MOODS, normalizeMoodId } from '../content/dailyCheckInContent';
import {
  getHealingMessageByIndex,
  pickMessageIndexForDate,
  pickNewMessageIndex,
} from './healingMessages';
import {
  getRecoveryQuoteByIndex,
  getRecoveryQuoteCategoryByIndex,
  pickQuoteIndexForDate,
  pickNewQuoteIndex,
} from '../content/recoveryQuotes';

/** Keys used in the phone's local storage (AsyncStorage). */
export const STORAGE_KEYS = {
  JOURNAL: '@ghostmode/journal',
  MOODS: '@ghostmode/moods',
  NO_CONTACT_START: '@ghostmode/no_contact_start',
  REMINDER: '@ghostmode/reminder',
  SETUP_COMPLETE: '@ghostmode/setup_complete',
  MAIN_GOAL: '@ghostmode/main_goal',
  DAILY_HEALING: '@ghostmode/daily_healing',
  DAILY_RECOVERY_QUOTE: '@ghostmode/daily_recovery_quote',
  REASONS: '@ghostmode/reasons',
  DEVELOPER_PREMIUM: '@ghostmode/developer_premium',
  USER_PROFILE: '@ghostmode/user_profile',
  AUTH_SESSION: '@ghostmode/auth_session',
  DAILY_CHECKINS: '@ghostmode/daily_checkins',
  DAILY_CHECKINS_MIGRATED: '@ghostmode/daily_checkins_migrated',
  COACH_CHAT: '@ghostmode/coach_chat',
};

export const GOAL_OPTIONS = [
  'Stop texting them',
  'Heal and move on',
  'Build confidence',
  'Track my emotions',
];

export const DEFAULT_REMINDER = {
  enabled: true,
  time: '9:00 PM',
  message: 'Stay strong. You do not need to text them.',
};

async function readJson(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJson(key, value) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export function formatDisplayDate(isoDate) {
  const date = new Date(`${isoDate}T12:00:00`);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatEntryDate(isoDate) {
  const created = new Date(isoDate);
  const today = new Date();
  created.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today - created) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  const datePart = isoDate.includes('T') ? isoDate.split('T')[0] : isoDate;
  return formatDisplayDate(datePart);
}

export function formatJournalEntryDateTime(isoDate) {
  if (!isoDate) return '';
  const created = new Date(isoDate);
  const timePart = created.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${formatEntryDate(isoDate)} · ${timePart}`;
}

export function getStreakDay(isoDate) {
  const start = new Date(`${isoDate}T12:00:00`);
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today - start) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff + 1);
}

export function getTodayDateKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function defaultStartDate(daysAgo = 12) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

// ——— Journal ———

function normalizeJournalEntry(entry, index) {
  const createdAt =
    entry.createdAt ||
    (typeof entry.date === 'string' && entry.date.includes('T')
      ? entry.date
      : null) ||
    new Date(Date.now() - index).toISOString();

  return {
    ...entry,
    id:
      entry.id ||
      `legacy-${createdAt}-${index}-${String(entry.text || '').slice(0, 12)}`,
    createdAt,
    text: String(entry.text || ''),
  };
}

export async function loadJournalEntries() {
  const entries = await readJson(STORAGE_KEYS.JOURNAL, []);
  if (!Array.isArray(entries)) return [];

  const normalized = entries.map(normalizeJournalEntry);
  const sorted = [...normalized].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

  const needsMigration = entries.some(
    (entry) => !entry.id || !entry.createdAt || typeof entry.text !== 'string'
  );
  if (needsMigration) {
    await writeJson(STORAGE_KEYS.JOURNAL, sorted);
  }

  return sorted;
}

export async function saveJournalEntries(entries) {
  await writeJson(STORAGE_KEYS.JOURNAL, entries);
}

export async function deleteJournalEntry(id) {
  const entries = await loadJournalEntries();
  const updated = entries.filter((entry) => String(entry.id) !== String(id));
  await saveJournalEntries(updated);
  return updated;
}

// ——— Mood logs (shared by Mood tab and Daily Check-In) ———

export const MOOD_OPTIONS = CHECKIN_MOODS.map((mood) => mood.id);

const DAILY_MOOD_ID_PREFIX = 'mood-daily-';

export function getDailyMoodLogId(dateKey) {
  return `${DAILY_MOOD_ID_PREFIX}${dateKey}`;
}

export function isDailyMoodLog(entry) {
  return String(entry?.id || '').startsWith(DAILY_MOOD_ID_PREFIX);
}

function getDailyMoodDateFromLog(entry) {
  return String(entry.id || '').slice(DAILY_MOOD_ID_PREFIX.length);
}

function moodLogToCheckIn(entry) {
  const date = isDailyMoodLog(entry)
    ? getDailyMoodDateFromLog(entry)
    : getTodayDateKeyFromIso(entry.createdAt);

  return normalizeDailyCheckIn({
    id: entry.id,
    date,
    mood: entry.mood,
    createdAt: entry.createdAt,
  });
}

function normalizeMoodLog(entry, index) {
  const createdAt =
    entry.createdAt ||
    (typeof entry.date === 'string' && entry.date.includes('T')
      ? entry.date
      : null) ||
    new Date(Date.now() - index).toISOString();

  return {
    ...entry,
    id:
      entry.id ||
      `legacy-mood-${createdAt}-${index}-${String(entry.mood || '').slice(0, 8)}`,
    createdAt,
    mood: normalizeMoodId(entry.mood || 'healing'),
    note: String(entry.note || ''),
  };
}

function getTodayDateKeyFromIso(isoString) {
  if (!isoString) return getTodayDateKey();
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return getTodayDateKey();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function migrateLegacyDailyCheckIns() {
  const migrated = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_CHECKINS_MIGRATED);
  if (migrated === 'true') return;

  const legacyCheckins = await readJson(STORAGE_KEYS.DAILY_CHECKINS, []);
  if (Array.isArray(legacyCheckins) && legacyCheckins.length) {
    const logs = await readJson(STORAGE_KEYS.MOODS, []);
    const existingDailyIds = new Set(
      (Array.isArray(logs) ? logs : [])
        .filter(isDailyMoodLog)
        .map((entry) => entry.id)
    );

    const migratedLogs = legacyCheckins
      .map((entry, index) =>
        normalizeMoodLog(
          {
            id: getDailyMoodLogId(String(entry.date || getTodayDateKey())),
            mood: entry.mood,
            note: '',
            createdAt: entry.createdAt,
          },
          index
        )
      )
      .filter((entry) => !existingDailyIds.has(entry.id));

    if (migratedLogs.length) {
      const combined = [...migratedLogs, ...(Array.isArray(logs) ? logs : [])].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
      await writeJson(STORAGE_KEYS.MOODS, combined);
    }
  }

  await AsyncStorage.setItem(STORAGE_KEYS.DAILY_CHECKINS_MIGRATED, 'true');
}

export async function loadMoodLogs() {
  await migrateLegacyDailyCheckIns();

  const logs = await readJson(STORAGE_KEYS.MOODS, []);
  if (!Array.isArray(logs)) return [];

  const normalized = logs.map(normalizeMoodLog);
  const sorted = [...normalized].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

  const needsMigration = logs.some(
    (entry) =>
      !entry.id ||
      !entry.createdAt ||
      typeof entry.note !== 'string' ||
      normalizeMoodId(entry.mood) !== String(entry.mood || '').trim()
  );
  if (needsMigration) {
    await writeJson(STORAGE_KEYS.MOODS, sorted);
  }

  return sorted;
}

export async function saveMoodLogs(logs) {
  await writeJson(STORAGE_KEYS.MOODS, logs);
}

export async function deleteMoodLog(id) {
  const logs = await loadMoodLogs();
  const updated = logs.filter((log) => String(log.id) !== String(id));
  await saveMoodLogs(updated);
  return updated;
}

// ——— Daily check-ins (one mood per calendar day) ———

function normalizeDailyCheckIn(entry) {
  return {
    id: entry.id || `checkin-${entry.date}`,
    date: String(entry.date || ''),
    mood: String(entry.mood || ''),
    createdAt: entry.createdAt || new Date().toISOString(),
  };
}

export async function loadDailyCheckIns() {
  const logs = await loadMoodLogs();
  return logs
    .filter(isDailyMoodLog)
    .map(moodLogToCheckIn)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function saveDailyCheckIn(mood) {
  const date = getTodayDateKey();
  const moodId = normalizeMoodId(mood);
  const logs = await loadMoodLogs();
  const dailyId = getDailyMoodLogId(date);
  const filtered = logs.filter((entry) => entry.id !== dailyId);
  const entry = normalizeMoodLog(
    {
      id: dailyId,
      mood: moodId,
      note: '',
      createdAt: new Date().toISOString(),
    },
    0
  );
  const updated = [entry, ...filtered].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
  await saveMoodLogs(updated);
  return moodLogToCheckIn(entry);
}

export async function getTodaysCheckIn() {
  const today = getTodayDateKey();
  const logs = await loadMoodLogs();
  const daily = logs.find((entry) => entry.id === getDailyMoodLogId(today));
  return daily ? moodLogToCheckIn(daily) : null;
}

export function getCheckInStreak(checkins) {
  if (!Array.isArray(checkins) || !checkins.length) return 0;

  const dates = new Set(checkins.map((entry) => entry.date));
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (true) {
    const year = cursor.getFullYear();
    const month = String(cursor.getMonth() + 1).padStart(2, '0');
    const day = String(cursor.getDate()).padStart(2, '0');
    const key = `${year}-${month}-${day}`;

    if (!dates.has(key)) break;

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function getRecentCheckInCalendar(checkins, days = 14) {
  const map = new Map(checkins.map((entry) => [entry.date, entry]));
  const result = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() - (days - 1));

  for (let i = 0; i < days; i += 1) {
    const year = cursor.getFullYear();
    const month = String(cursor.getMonth() + 1).padStart(2, '0');
    const day = String(cursor.getDate()).padStart(2, '0');
    const date = `${year}-${month}-${day}`;

    result.push({
      date,
      checkIn: map.get(date) || null,
      dayLabel: cursor.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 1),
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}

// ——— No-contact start date ———

export async function loadNoContactStart() {
  return AsyncStorage.getItem(STORAGE_KEYS.NO_CONTACT_START);
}

export async function saveNoContactStart(isoDate) {
  await AsyncStorage.setItem(STORAGE_KEYS.NO_CONTACT_START, isoDate);
}

export async function resetNoContactStreak() {
  const today = getTodayDateKey();
  await saveNoContactStart(today);
  return today;
}

export async function getOrInitNoContactStart() {
  const start = await loadNoContactStart();
  if (start) return start;
  // Display-only fallback — do not write storage until Setup or Settings saves a date.
  return getTodayDateKey();
}

export async function ensureNoContactStartOnHeal() {
  const existing = await loadNoContactStart();
  if (!existing) {
    const today = new Date().toISOString().split('T')[0];
    await saveNoContactStart(today);
    return today;
  }
  return existing;
}

// ——— Reminder settings ———

export async function loadReminderSettings() {
  const saved = await readJson(STORAGE_KEYS.REMINDER, null);
  return { ...DEFAULT_REMINDER, ...(saved || {}) };
}

export async function saveReminderSettings(settings) {
  await writeJson(STORAGE_KEYS.REMINDER, {
    enabled: Boolean(settings.enabled),
    time: settings.time || DEFAULT_REMINDER.time,
    message: settings.message || DEFAULT_REMINDER.message,
  });
}

// ——— Daily healing message ———

export async function loadDailyHealingState() {
  return readJson(STORAGE_KEYS.DAILY_HEALING, null);
}

export async function saveDailyHealingState({ date, messageIndex }) {
  await writeJson(STORAGE_KEYS.DAILY_HEALING, {
    date,
    messageIndex,
  });
}

export async function getTodaysHealingMessage() {
  const today = getTodayDateKey();
  const saved = await loadDailyHealingState();

  if (
    saved?.date === today &&
    typeof saved.messageIndex === 'number' &&
    Number.isFinite(saved.messageIndex)
  ) {
    const messageIndex = saved.messageIndex;
    return {
      date: today,
      messageIndex,
      message: getHealingMessageByIndex(messageIndex),
    };
  }

  const messageIndex = pickMessageIndexForDate(today);
  await saveDailyHealingState({ date: today, messageIndex });

  return {
    date: today,
    messageIndex,
    message: getHealingMessageByIndex(messageIndex),
  };
}

export async function refreshTodaysHealingMessage(currentIndex) {
  const today = getTodayDateKey();
  const messageIndex = pickNewMessageIndex(currentIndex);
  await saveDailyHealingState({ date: today, messageIndex });

  return {
    date: today,
    messageIndex,
    message: getHealingMessageByIndex(messageIndex),
  };
}

// ——— Daily recovery quote ———

export async function loadDailyRecoveryQuoteState() {
  return readJson(STORAGE_KEYS.DAILY_RECOVERY_QUOTE, null);
}

export async function saveDailyRecoveryQuoteState({ date, quoteIndex }) {
  await writeJson(STORAGE_KEYS.DAILY_RECOVERY_QUOTE, {
    date,
    quoteIndex,
  });
}

export async function getTodaysRecoveryQuote() {
  const today = getTodayDateKey();
  const saved = await loadDailyRecoveryQuoteState();

  if (
    saved?.date === today &&
    typeof saved.quoteIndex === 'number' &&
    Number.isFinite(saved.quoteIndex)
  ) {
    const quoteIndex = saved.quoteIndex;
    return {
      date: today,
      quoteIndex,
      quote: getRecoveryQuoteByIndex(quoteIndex),
      category: getRecoveryQuoteCategoryByIndex(quoteIndex),
    };
  }

  const quoteIndex = pickQuoteIndexForDate(today);
  await saveDailyRecoveryQuoteState({ date: today, quoteIndex });

  return {
    date: today,
    quoteIndex,
    quote: getRecoveryQuoteByIndex(quoteIndex),
    category: getRecoveryQuoteCategoryByIndex(quoteIndex),
  };
}

export async function refreshTodaysRecoveryQuote(currentIndex) {
  const today = getTodayDateKey();
  const quoteIndex = pickNewQuoteIndex(currentIndex);
  await saveDailyRecoveryQuoteState({ date: today, quoteIndex });

  return {
    date: today,
    quoteIndex,
    quote: getRecoveryQuoteByIndex(quoteIndex),
    category: getRecoveryQuoteCategoryByIndex(quoteIndex),
  };
}

// ——— Reasons not to text ———

function normalizeReason(entry, index) {
  const createdAt =
    entry.createdAt ||
    new Date(Date.now() - index).toISOString();

  return {
    ...entry,
    id:
      entry.id ||
      `legacy-reason-${createdAt}-${index}-${String(entry.text || '').slice(0, 12)}`,
    createdAt,
    text: String(entry.text || ''),
  };
}

export async function loadReasons() {
  const reasons = await readJson(STORAGE_KEYS.REASONS, []);
  if (!Array.isArray(reasons)) return [];

  const normalized = reasons.map(normalizeReason);
  const sorted = [...normalized].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

  const needsMigration = reasons.some(
    (entry) => !entry.id || !entry.createdAt || typeof entry.text !== 'string'
  );
  if (needsMigration) {
    await writeJson(STORAGE_KEYS.REASONS, sorted);
  }

  return sorted;
}

export async function saveReasons(reasons) {
  await writeJson(STORAGE_KEYS.REASONS, reasons);
}

export async function deleteReason(id) {
  const reasons = await loadReasons();
  const updated = reasons.filter((reason) => String(reason.id) !== String(id));
  await saveReasons(updated);
  return updated;
}

export async function getRandomReason() {
  const reasons = await loadReasons();
  if (!reasons.length) return null;
  const index = Math.floor(Math.random() * reasons.length);
  return reasons[index];
}

// ——— Setup ———

export async function loadSetupComplete() {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.SETUP_COMPLETE);
  return value === 'true';
}

export async function saveSetupComplete(complete = true) {
  await AsyncStorage.setItem(
    STORAGE_KEYS.SETUP_COMPLETE,
    complete ? 'true' : 'false'
  );
}

export async function loadMainGoal() {
  return AsyncStorage.getItem(STORAGE_KEYS.MAIN_GOAL);
}

export async function saveMainGoal(goal) {
  await AsyncStorage.setItem(STORAGE_KEYS.MAIN_GOAL, goal);
}

export async function saveSetupProfile({ startDate, goal, reminderTime }) {
  await saveNoContactStart(startDate);
  await saveMainGoal(goal);
  await saveReminderSettings({
    enabled: true,
    time: reminderTime,
    message: DEFAULT_REMINDER.message,
  });
  await saveSetupComplete(true);
}

export async function getPostAuthRoute() {
  const setupComplete = await loadSetupComplete();
  if (setupComplete) return 'MainTabs';
  return 'Onboarding';
}

export async function getAppEntryRoute() {
  const loggedIn = await isUserLoggedIn();
  if (!loggedIn) return 'Login';
  return getPostAuthRoute();
}

// ——— Local auth (AsyncStorage demo) ———
// Screens call utils/authService.js, which uses these functions until Firebase is connected.
// See config/firebaseConfig.js for Firebase API key placeholders.

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function loadUserProfile() {
  return readJson(STORAGE_KEYS.USER_PROFILE, null);
}

async function saveUserProfile(profile) {
  await writeJson(STORAGE_KEYS.USER_PROFILE, profile);
}

export async function isUserLoggedIn() {
  const session = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
  if (session !== 'true') return false;
  const profile = await loadUserProfile();
  return Boolean(profile?.email);
}

export async function loadLoggedInUser() {
  if (!(await isUserLoggedIn())) return null;
  const profile = await loadUserProfile();
  if (!profile) return null;
  return {
    name: profile.name,
    email: profile.email,
  };
}

async function setAuthSession(active) {
  await AsyncStorage.setItem(
    STORAGE_KEYS.AUTH_SESSION,
    active ? 'true' : 'false'
  );
}

async function hashLocalPassword(password, email) {
  const salt = `ghostmode:local:${normalizeEmail(email)}`;
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${String(password)}`
  );
}

async function verifyLocalPassword(profile, password) {
  const trimmedPassword = String(password || '');

  if (profile.passwordHash) {
    const hash = await hashLocalPassword(trimmedPassword, profile.email);
    return hash === profile.passwordHash;
  }

  if (profile.password) {
    if (profile.password !== trimmedPassword) {
      return false;
    }
    const passwordHash = await hashLocalPassword(trimmedPassword, profile.email);
    const { password: _legacyPassword, ...rest } = profile;
    await saveUserProfile({ ...rest, passwordHash });
    return true;
  }

  return false;
}

export async function registerLocalUser({ name, email, password }) {
  const trimmedName = String(name || '').trim();
  const normalizedEmail = normalizeEmail(email);
  const trimmedPassword = String(password || '');

  if (!trimmedName) {
    return { ok: false, message: 'Please enter your name.' };
  }
  if (!isValidEmail(normalizedEmail)) {
    return { ok: false, message: 'Please enter a valid email address.' };
  }
  if (trimmedPassword.length < 6) {
    return { ok: false, message: 'Password must be at least 6 characters.' };
  }

  const existing = await loadUserProfile();
  if (existing?.email) {
    return {
      ok: false,
      message: 'An account already exists on this device. Please log in instead.',
    };
  }

  const passwordHash = await hashLocalPassword(trimmedPassword, normalizedEmail);

  const profile = {
    name: trimmedName,
    email: normalizedEmail,
    // Demo only — hash stored locally. Replace with real auth before production.
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  await saveUserProfile(profile);
  await setAuthSession(true);

  return {
    ok: true,
    user: { name: profile.name, email: profile.email },
  };
}

export async function loginLocalUser({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const trimmedPassword = String(password || '');

  if (!normalizedEmail || !trimmedPassword) {
    return { ok: false, message: 'Please enter your email and password.' };
  }

  const profile = await loadUserProfile();
  if (!profile?.email) {
    return {
      ok: false,
      message: 'No account found on this device. Please sign up first.',
    };
  }

  const passwordOk = await verifyLocalPassword(profile, trimmedPassword);
  if (profile.email !== normalizedEmail || !passwordOk) {
    return { ok: false, message: 'Incorrect email or password.' };
  }

  await setAuthSession(true);

  return {
    ok: true,
    user: { name: profile.name, email: profile.email },
  };
}

export async function logoutLocalUser() {
  await setAuthSession(false);
}

// ——— Premium (developer toggle + RevenueCat subscriptions later) ———
// Real App Store premium is checked in context/PremiumContext.js via services/purchasesService.js.

export async function loadDeveloperPremium() {
  return (await AsyncStorage.getItem(STORAGE_KEYS.DEVELOPER_PREMIUM)) === 'true';
}

export async function saveDeveloperPremium(enabled) {
  await AsyncStorage.setItem(
    STORAGE_KEYS.DEVELOPER_PREMIUM,
    enabled ? 'true' : 'false'
  );
}

export async function isPremiumUnlocked() {
  const devPremium = await loadDeveloperPremium();
  if (devPremium) return true;

  // LATER: import { checkPremiumEntitlement } from './revenueCat';
  // return checkPremiumEntitlement();
  return devPremium;
}

const MAX_COACH_CHAT_MESSAGES = 200;

function normalizeCoachMessage(message) {
  if (!message?.id || !message?.sender || typeof message.text !== 'string') {
    return null;
  }

  return {
    id: message.id,
    sender: message.sender,
    text: message.text,
    ...(message.crisis ? { crisis: true } : {}),
    ...(Array.isArray(message.recoveryActions) && message.recoveryActions.length
      ? {
          recoveryActions: message.recoveryActions
            .map((action) =>
              typeof action === 'string'
                ? action
                : action?.id
            )
            .filter(Boolean),
        }
      : {}),
  };
}

/** Loads saved AI Coach conversation from the phone. */
export async function loadCoachChat() {
  const data = await readJson(STORAGE_KEYS.COACH_CHAT, null);
  if (!Array.isArray(data)) return null;

  return data
    .map(normalizeCoachMessage)
    .filter(Boolean)
    .slice(-MAX_COACH_CHAT_MESSAGES);
}

/** Saves AI Coach conversation locally (newest messages kept if over limit). */
export async function saveCoachChat(messages) {
  if (!Array.isArray(messages)) return;

  const normalized = messages
    .map(normalizeCoachMessage)
    .filter(Boolean)
    .slice(-MAX_COACH_CHAT_MESSAGES);

  await writeJson(STORAGE_KEYS.COACH_CHAT, normalized);
}

/** Removes saved AI Coach conversation from the phone. */
export async function clearCoachChat() {
  await AsyncStorage.removeItem(STORAGE_KEYS.COACH_CHAT);
}

export async function clearAllAppData() {
  await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
}
