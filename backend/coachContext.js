/**
 * Validates optional AI Coach personalization context from the app.
 * Only allowlisted fields are kept — unknown keys are dropped.
 */

const ALLOWED_MOOD_IDS = new Set([
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
]);

const ALLOWED_GOALS = new Set([
  'Stop texting them',
  'Heal and move on',
  'Build confidence',
  'Track my emotions',
]);

const MOOD_LABELS = {
  struggling: 'Struggling',
  missing_them: 'Missing them',
  okay: 'Okay',
  better: 'Better',
  strong: 'Strong',
  hurting: 'Hurting',
  anxious: 'Anxious',
  angry: 'Angry',
  healing: 'Healing',
  confident: 'Confident',
};

function sanitizeStreakDay(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const day = Math.floor(n);
  if (day < 1 || day > 100000) return null;
  return day;
}

function sanitizeMoodId(value) {
  if (value == null || value === '') return null;
  const id = String(value).trim();
  if (ALLOWED_MOOD_IDS.has(id)) return id;
  if (id === 'missing them') return 'missing_them';
  return null;
}

function sanitizeGoal(value) {
  if (value == null || value === '') return null;
  const trimmed = String(value).trim();
  return ALLOWED_GOALS.has(trimmed) ? trimmed : null;
}

/**
 * Returns a sanitized context object or null.
 * Never keeps journal text, email, name, passwords, or free-form fields.
 */
function sanitizeCoachContext(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;

  const context = {};
  const streakDay = sanitizeStreakDay(raw.streakDay);
  const todayMood = sanitizeMoodId(raw.todayMood || raw.moodId || raw.mood);
  const recoveryGoal = sanitizeGoal(raw.recoveryGoal || raw.goal);

  if (streakDay != null) context.streakDay = streakDay;
  if (todayMood) {
    context.todayMood = todayMood;
    context.todayMoodLabel = MOOD_LABELS[todayMood] || todayMood;
  }
  if (recoveryGoal) context.recoveryGoal = recoveryGoal;

  return Object.keys(context).length ? context : null;
}

/**
 * Short system add-on so the model can personalize lightly without diagnosing.
 */
function formatContextForPrompt(context) {
  if (!context) return null;

  const lines = [
    'Optional recovery context the user chose to share (opt-in only):',
  ];

  if (context.streakDay != null) {
    lines.push(`- No-contact streak: day ${context.streakDay}`);
  }
  if (context.todayMoodLabel || context.todayMood) {
    lines.push(`- Today's mood check-in: ${context.todayMoodLabel || context.todayMood}`);
  }
  if (context.recoveryGoal) {
    lines.push(`- Recovery goal: ${context.recoveryGoal}`);
  }

  lines.push(
    'Use this lightly to make support feel more personal. Stay nonjudgmental. Do not diagnose, label clinical conditions, or promise therapy outcomes. Do not invent details that are not listed. If context conflicts with their message, prioritize their latest words.'
  );

  return lines.join('\n');
}

module.exports = {
  sanitizeCoachContext,
  formatContextForPrompt,
  ALLOWED_MOOD_IDS,
  ALLOWED_GOALS,
};
