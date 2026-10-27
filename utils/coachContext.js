/**
 * Opt-in personalization for AI Coach (v1.3 Phase 1).
 * Only streak day, today's mood id, and recovery goal — never journal text,
 * email, passwords, or free-form personal data.
 */
import { getMoodDisplayLabel, normalizeMoodId } from '../content/dailyCheckInContent';
import {
  GOAL_OPTIONS,
  getOrInitNoContactStart,
  getStreakDay,
  getTodaysCheckIn,
  loadCoachContextShareEnabled,
  loadMainGoal,
} from './storage';

export const COACH_CONTEXT_VERSION = 1;

export const ALLOWED_COACH_MOOD_IDS = [
  'struggling',
  'missing_them',
  'okay',
  'better',
  'strong',
  'hurting',
  'anxious',
  'angry',
  'healing',
  'confident',
];

export const ALLOWED_COACH_GOALS = [...GOAL_OPTIONS];

const ALLOWED_MOOD_SET = new Set(ALLOWED_COACH_MOOD_IDS);
const ALLOWED_GOAL_SET = new Set(ALLOWED_COACH_GOALS);

function sanitizeStreakDay(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const day = Math.floor(n);
  if (day < 1 || day > 100000) return null;
  return day;
}

function sanitizeMoodId(value) {
  if (value == null || value === '') return null;
  const normalized = normalizeMoodId(value);
  return ALLOWED_MOOD_SET.has(normalized) ? normalized : null;
}

function sanitizeGoal(value) {
  if (value == null || value === '') return null;
  const trimmed = String(value).trim();
  return ALLOWED_GOAL_SET.has(trimmed) ? trimmed : null;
}

/**
 * Builds the payload from already-loaded local values.
 * Returns null when opted out or when nothing safe can be shared.
 */
export function buildCoachContextFromData({
  optedIn,
  streakDay,
  moodId,
  recoveryGoal,
} = {}) {
  if (!optedIn) return null;

  const context = { version: COACH_CONTEXT_VERSION };
  const day = sanitizeStreakDay(streakDay);
  const mood = sanitizeMoodId(moodId);
  const goal = sanitizeGoal(recoveryGoal);

  if (day != null) context.streakDay = day;
  if (mood) {
    context.todayMood = mood;
    context.todayMoodLabel = getMoodDisplayLabel(mood);
  }
  if (goal) context.recoveryGoal = goal;

  const hasUsefulField =
    context.streakDay != null || Boolean(context.todayMood) || Boolean(context.recoveryGoal);

  return hasUsefulField ? context : null;
}

/** Strips unknown keys and unsafe values from a client-provided context object. */
export function sanitizeCoachContextPayload(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;

  return buildCoachContextFromData({
    optedIn: true,
    streakDay: raw.streakDay,
    moodId: raw.todayMood || raw.moodId || raw.mood,
    recoveryGoal: raw.recoveryGoal || raw.goal,
  });
}

/**
 * Loads opt-in preference + local streak/mood/goal and returns a safe context
 * object, or null when sharing is off / nothing available.
 */
export async function loadCoachPersonalizationContext() {
  const optedIn = await loadCoachContextShareEnabled();
  if (!optedIn) return null;

  const [start, checkIn, goal] = await Promise.all([
    getOrInitNoContactStart(),
    getTodaysCheckIn(),
    loadMainGoal(),
  ]);

  return buildCoachContextFromData({
    optedIn: true,
    streakDay: getStreakDay(start),
    moodId: checkIn?.mood || null,
    recoveryGoal: goal,
  });
}
