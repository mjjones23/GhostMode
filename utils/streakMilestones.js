/** No-contact streak milestones: day milestones plus a calendar anniversary every year, forever. */
import {
  addDaysToDateKey,
  addYearsToDateKey,
  daysBetween,
  formatDateKey,
  getCompletedYears,
  getStreakDayFromDateKeys,
} from './dateMath';

export const DAY_MILESTONES = [3, 7, 14, 30, 60, 90, 120, 180, 270];
export const BONUS_DAY_MILESTONES = [500, 1000];
export const ALL_DAY_MILESTONES = [...DAY_MILESTONES, ...BONUS_DAY_MILESTONES];

const DAY_ICONS = {
  3: 'leaf',
  7: 'sparkles',
  14: 'flame',
  30: 'shield-checkmark',
  60: 'diamond',
  90: 'flash',
  120: 'star',
  180: 'moon',
  270: 'planet',
  500: 'rocket',
  1000: 'infinite',
};

export function isCrownYear(year) {
  return year % 5 === 0;
}

export function getDayMilestoneMeta(days) {
  return {
    id: `streak_days_${days}`,
    kind: 'days',
    value: days,
    label: `${days} Days`,
    shortLabel: `Day ${days}`,
    icon: DAY_ICONS[days] || 'star',
    bonus: BONUS_DAY_MILESTONES.includes(days),
  };
}

export function getYearMilestoneMeta(year) {
  return {
    id: `streak_year_${year}`,
    kind: 'year',
    value: year,
    label: year === 1 ? '1 Year' : `${year} Years`,
    shortLabel: `Year ${year}`,
    icon: isCrownYear(year) ? 'trophy' : 'ribbon',
    crown: isCrownYear(year),
  };
}

/** Milestones for one streak in date order, with the date and streak day each unlocks on. */
export function getStreakMilestoneTimeline(startKey, throughYear) {
  const dayEvents = ALL_DAY_MILESTONES.map((days) => ({
    ...getDayMilestoneMeta(days),
    dateKey: addDaysToDateKey(startKey, days - 1),
    dayNumber: days,
  }));

  const yearEvents = [];
  for (let year = 1; year <= throughYear; year += 1) {
    const dateKey = addYearsToDateKey(startKey, year);
    yearEvents.push({
      ...getYearMilestoneMeta(year),
      dateKey,
      dayNumber: daysBetween(startKey, dateKey) + 1,
    });
  }

  return [...dayEvents, ...yearEvents].sort((a, b) =>
    a.dateKey === b.dateKey ? a.dayNumber - b.dayNumber : a.dateKey.localeCompare(b.dateKey)
  );
}

/**
 * Progress from the last milestone to the next one in the current streak.
 * There is always a next milestone — after the day milestones it is the next anniversary.
 */
export function getStreakMilestoneProgress(startKey, todayKey) {
  const streakDay = getStreakDayFromDateKeys(startKey, todayKey);
  const completedYears = getCompletedYears(startKey, todayKey);
  const timeline = getStreakMilestoneTimeline(startKey, completedYears + 2);

  const reachedToday = timeline.filter((event) => event.dateKey === todayKey).pop() || null;
  const previous = timeline.filter((event) => event.dateKey < todayKey).pop() || null;
  const next = timeline.find((event) => event.dateKey > todayKey);

  const base = previous ? previous.dayNumber : 0;

  if (reachedToday) {
    const total = Math.max(1, reachedToday.dayNumber - base);
    return {
      streakDay,
      completedYears,
      previous,
      reachedToday,
      next,
      current: total,
      total,
      progress: 1,
      percent: 100,
      isComplete: true,
    };
  }

  const total = Math.max(1, next.dayNumber - base);
  const current = Math.min(total, Math.max(0, streakDay - base));
  const progress = current / total;

  return {
    streakDay,
    completedYears,
    previous,
    reachedToday: null,
    next,
    current,
    total,
    progress,
    percent: Math.round(progress * 100),
    isComplete: false,
  };
}

export function describeMilestoneStatus(progress) {
  if (progress.reachedToday) {
    const reached = progress.reachedToday;
    return `Milestone reached — ${reached.kind === 'year' ? reached.label : `Day ${reached.value}`}`;
  }
  const { next } = progress;
  if (next.kind === 'year') return `Next: ${next.label} on ${formatDateKey(next.dateKey)}`;
  return `Next milestone: Day ${next.value}`;
}

export function getStreakCelebrationMessage(milestone) {
  if (milestone.kind === 'year') {
    return milestone.value === 1
      ? 'One full year of choosing yourself. That is yours forever.'
      : `${milestone.label} of choosing yourself. Look how far you have come.`;
  }
  return `You reached ${milestone.value} days. You chose yourself, and that matters.`;
}
