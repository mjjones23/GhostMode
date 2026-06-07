/** Free users can view this many journal/mood history items. */
export const FREE_HISTORY_LIMIT = 3;

export function limitHistoryForFree(items, isPremium, limit = FREE_HISTORY_LIMIT) {
  if (isPremium || !Array.isArray(items)) return items;
  return items.slice(0, limit);
}

export function getHiddenHistoryCount(items, isPremium, limit = FREE_HISTORY_LIMIT) {
  if (isPremium || !Array.isArray(items)) return 0;
  return Math.max(0, items.length - limit);
}

export const PREMIUM_FEATURES = {
  AI_COACH: 'ai_coach',
  PROGRESS_INSIGHTS: 'progress_insights',
  UNLIMITED_JOURNAL: 'unlimited_journal',
  UNLIMITED_MOOD: 'unlimited_mood',
  DAILY_REMINDERS: 'daily_reminders',
};
