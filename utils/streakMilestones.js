/** No-contact streak milestones, levels, and badge helpers. */

export const STREAK_MILESTONES = [7, 30, 60, 90, 180, 365, 500, 1000];

export const STREAK_BADGES = [
  { id: 'days_7', days: 7, label: '7 Days', emoji: '✨' },
  { id: 'days_30', days: 30, label: '30 Days', emoji: '🛡️' },
  { id: 'days_60', days: 60, label: '60 Days', emoji: '💎' },
  { id: 'days_90', days: 90, label: '90 Days', emoji: '🔥' },
  { id: 'days_180', days: 180, label: '180 Days', emoji: '🌙' },
  { id: 'days_365', days: 365, label: '365 Days', emoji: '👑' },
  { id: 'days_500', days: 500, label: '500 Days', emoji: '🦅' },
  { id: 'days_1000', days: 1000, label: '1000 Days', emoji: '🏆' },
];

export const RECOVERY_LEVELS = [
  {
    id: 'survivor',
    minDays: 0,
    maxDays: 30,
    label: 'Survivor',
    emoji: '🌱',
    color: '#86efac',
  },
  {
    id: 'rebuilding',
    minDays: 31,
    maxDays: 90,
    label: 'Rebuilding',
    emoji: '💪',
    color: '#93c5fd',
  },
  {
    id: 'strong',
    minDays: 91,
    maxDays: 180,
    label: 'Strong',
    emoji: '🔥',
    color: '#fca5a5',
  },
  {
    id: 'free',
    minDays: 181,
    maxDays: 365,
    label: 'Free',
    emoji: '🦅',
    color: '#c4b5fd',
  },
  {
    id: 'unbreakable',
    minDays: 366,
    maxDays: Infinity,
    label: 'Unbreakable',
    emoji: '👑',
    color: '#fde68a',
  },
];

function safeDays(days) {
  const n = Number(days);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

/**
 * Largest milestone the user has already reached (or 0 if none).
 */
export function getPreviousMilestone(days) {
  const d = safeDays(days);
  let previous = 0;
  for (const milestone of STREAK_MILESTONES) {
    if (d >= milestone) previous = milestone;
    else break;
  }
  return previous;
}

/**
 * Next milestone still ahead. Null when every milestone is complete.
 */
export function getNextMilestone(days) {
  const d = safeDays(days);
  for (const milestone of STREAK_MILESTONES) {
    if (d < milestone) return milestone;
  }
  return null;
}

/**
 * Rolling progress toward the next milestone.
 * Exact milestone days show 100% complete for that milestone.
 */
export function getMilestoneProgress(days) {
  const d = safeDays(days);

  if (STREAK_MILESTONES.includes(d)) {
    const index = STREAK_MILESTONES.indexOf(d);
    const previous = index > 0 ? STREAK_MILESTONES[index - 1] : 0;
    const total = d - previous;
    return {
      previous,
      next: d,
      current: total,
      total,
      progress: 1,
      percent: 100,
      isComplete: true,
      isMaxed: false,
    };
  }

  const previous = getPreviousMilestone(d);
  const next = getNextMilestone(d);

  if (next == null) {
    const last = STREAK_MILESTONES[STREAK_MILESTONES.length - 1];
    return {
      previous: last,
      next: null,
      current: 1,
      total: 1,
      progress: 1,
      percent: 100,
      isComplete: true,
      isMaxed: true,
    };
  }

  const total = next - previous;
  const current = Math.max(0, d - previous);
  const progress = total > 0 ? Math.min(1, current / total) : 0;

  return {
    previous,
    next,
    current,
    total,
    progress,
    percent: Math.round(progress * 100),
    isComplete: false,
    isMaxed: false,
  };
}

export function getRecoveryLevel(days) {
  const d = safeDays(days);
  for (const level of RECOVERY_LEVELS) {
    if (d >= level.minDays && d <= level.maxDays) {
      return level;
    }
  }
  return RECOVERY_LEVELS[0];
}

export function getUnlockedBadges(days) {
  const d = safeDays(days);
  return STREAK_BADGES.filter((badge) => d >= badge.days);
}

export function getAllBadgesWithStatus(days) {
  const d = safeDays(days);
  return STREAK_BADGES.map((badge) => ({
    ...badge,
    unlocked: d >= badge.days,
  }));
}

export function getMilestoneReachedToday(days) {
  const d = safeDays(days);
  return STREAK_MILESTONES.includes(d) ? d : null;
}

export function getCelebrationMessage(milestoneDays) {
  return `You reached ${milestoneDays} days. You chose yourself, and that matters.`;
}
