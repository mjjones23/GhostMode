/**
 * Achievements & Levels. Unlocks are stored with the date they were earned and are
 * never removed — not by a streak reset, deleted entries, or unchecked activities.
 * Level points use a high-water mark so a level can never go down.
 */
import {
  ACHIEVEMENT_CATEGORIES,
  ACHIEVEMENT_TRACKS,
  CROWN_COLORS,
  LEVEL_NAMES,
  LEVEL_POINTS,
  TIER_COLORS,
} from '../content/achievements';
import { DAILY_PLAN_ACTIVITIES } from '../content/dailyRecoveryPlan';
import {
  addDaysToDateKey,
  addYearsToDateKey,
  dateKeyFromIso,
  formatDateKey,
  getCompletedYears,
  getStreakDayFromDateKeys,
  isValidDateKey,
  toDateKey,
} from './dateMath';
import { getPlanProgress } from './dailyRecoveryPlan';
import {
  getOrInitNoContactStart,
  loadAchievementsState,
  loadDailyPlans,
  loadJournalEntries,
  loadMoodLogs,
  loadReasons,
  resetNoContactStreak,
  saveAchievementsState,
} from './storage';
import {
  ALL_DAY_MILESTONES,
  getDayMilestoneMeta,
  getStreakCelebrationMessage,
  getStreakMilestoneProgress,
  getYearMilestoneMeta,
} from './streakMilestones';

const STATE_VERSION = 1;
const DAILY_MOOD_ID_PREFIX = 'mood-daily-';

const ACTIVITY_CATEGORY_BY_ID = Object.fromEntries(
  DAILY_PLAN_ACTIVITIES.map((activity) => [activity.id, activity.category])
);
const TRACK_BY_ID = Object.fromEntries(ACHIEVEMENT_TRACKS.map((track) => [track.id, track]));

function createInitialState() {
  return {
    version: STATE_VERSION,
    unlocked: {},
    pending: [],
    welcome: null,
    bestStreakDays: 0,
    pastStreakDays: 0,
    urgesResisted: 0,
    pointsHighWater: 0,
    initializedAt: null,
    lastStreakCelebration: null,
  };
}

function normalizeState(raw) {
  const base = createInitialState();
  if (!raw || typeof raw !== 'object') return base;
  return {
    ...base,
    ...raw,
    unlocked: raw.unlocked && typeof raw.unlocked === 'object' ? raw.unlocked : {},
    pending: Array.isArray(raw.pending) ? raw.pending : [],
    bestStreakDays: Number(raw.bestStreakDays) || 0,
    pastStreakDays: Number(raw.pastStreakDays) || 0,
    urgesResisted: Number(raw.urgesResisted) || 0,
    pointsHighWater: Number(raw.pointsHighWater) || 0,
  };
}

let achievementsQueue = Promise.resolve();

function enqueueAchievementsWrite(task) {
  const run = achievementsQueue.then(task, task);
  achievementsQueue = run.catch(() => {});
  return run;
}

// ——— Tracks ———

/** Tier values up to and including the first one above `count` (the next goal). */
export function getTrackTiersThrough(track, count) {
  const values = [...track.tiers];
  let last = values[values.length - 1];
  while (last <= count) {
    last += track.repeatEvery;
    values.push(last);
  }
  return values;
}

function trackAchievementId(trackId, value) {
  return `${trackId}_${value}`;
}

function parseTrackAchievementId(id) {
  const index = id.lastIndexOf('_');
  const track = TRACK_BY_ID[id.slice(0, index)];
  const value = Number(id.slice(index + 1));
  return track && Number.isFinite(value) ? { track, value } : null;
}

// ——— Stats ———

async function loadAchievementStats() {
  const [startRaw, plans, journal, moods, reasons] = await Promise.all([
    getOrInitNoContactStart(),
    loadDailyPlans(),
    loadJournalEntries(),
    loadMoodLogs(),
    loadReasons(),
  ]);

  const today = toDateKey();
  const startCandidate = String(startRaw || '').slice(0, 10);
  const start = isValidDateKey(startCandidate) ? startCandidate : today;

  let plansCompleted = 0;
  let planActivities = 0;
  const categoryCounts = { movement: 0, self_care: 0, connection: 0 };

  Object.values(plans || {}).forEach((plan) => {
    if (!plan || !Array.isArray(plan.activityIds)) return;
    if (getPlanProgress(plan).isComplete) plansCompleted += 1;
    plan.activityIds.forEach((id) => {
      if (!plan.completed?.[id]) return;
      planActivities += 1;
      const category = ACTIVITY_CATEGORY_BY_ID[id];
      if (category in categoryCounts) categoryCounts[category] += 1;
    });
  });

  const journalDays = new Set(
    journal.map((entry) => dateKeyFromIso(entry.createdAt)).filter(Boolean)
  ).size;

  const checkinDays = new Set(
    moods
      .map((entry) =>
        String(entry.id || '').startsWith(DAILY_MOOD_ID_PREFIX)
          ? String(entry.id).slice(DAILY_MOOD_ID_PREFIX.length)
          : dateKeyFromIso(entry.createdAt)
      )
      .filter(Boolean)
  ).size;

  return {
    today,
    start,
    streakDay: getStreakDayFromDateKeys(start, today),
    completedYears: getCompletedYears(start, today),
    counts: {
      plans_completed: plansCompleted,
      plan_activities: planActivities,
      journal_entries: journal.length,
      journal_days: journalDays,
      checkin_days: checkinDays,
      movement: categoryCounts.movement,
      self_care: categoryCounts.self_care,
      connection: categoryCounts.connection,
      reasons_saved: reasons.length,
    },
  };
}

function getTrackCount(trackId, stats, state) {
  if (trackId === 'urges_resisted') return state.urgesResisted;
  return stats.counts[trackId] || 0;
}

// ——— Levels ———

export function getLevelThreshold(level) {
  return 50 * level * (level - 1);
}

export function getLevelForPoints(points) {
  const safePoints = Math.max(0, Number(points) || 0);
  let level = Math.max(1, Math.floor((1 + Math.sqrt(1 + 0.08 * safePoints)) / 2));
  while (getLevelThreshold(level + 1) <= safePoints) level += 1;
  while (level > 1 && getLevelThreshold(level) > safePoints) level -= 1;
  return level;
}

export function getLevelInfo(points) {
  const level = getLevelForPoints(points);
  const name = LEVEL_NAMES[Math.min(level, LEVEL_NAMES.length) - 1];
  const floor = getLevelThreshold(level);
  const ceiling = getLevelThreshold(level + 1);
  const progress = (points - floor) / (ceiling - floor);

  return {
    level,
    name,
    title: level > LEVEL_NAMES.length ? `${name} · Level ${level}` : `Level ${level} · ${name}`,
    points,
    floor,
    ceiling,
    pointsToNext: ceiling - points,
    progress: Math.min(1, Math.max(0, progress)),
  };
}

function computePoints(stats, state) {
  const lifetimeDays = state.pastStreakDays + stats.streakDay;
  return (
    lifetimeDays * LEVEL_POINTS.noContactDay +
    stats.counts.plan_activities * LEVEL_POINTS.planActivity +
    stats.counts.plans_completed * LEVEL_POINTS.planComplete +
    stats.counts.journal_days * LEVEL_POINTS.journalDay +
    stats.counts.checkin_days * LEVEL_POINTS.checkInDay +
    state.urgesResisted * LEVEL_POINTS.urgeResisted +
    Object.keys(state.unlocked).length * LEVEL_POINTS.achievement
  );
}

// ——— Evaluation ———

/** Adds any newly earned achievements to `state` (mutates) and returns their ids. */
function applyUnlocks(state, stats) {
  const added = [];
  const unlock = (id, dateKey) => {
    if (state.unlocked[id]) return;
    state.unlocked[id] = dateKey;
    added.push(id);
  };

  ALL_DAY_MILESTONES.forEach((days) => {
    if (stats.streakDay >= days) {
      unlock(getDayMilestoneMeta(days).id, addDaysToDateKey(stats.start, days - 1));
    }
  });

  for (let year = 1; year <= stats.completedYears; year += 1) {
    unlock(getYearMilestoneMeta(year).id, addYearsToDateKey(stats.start, year));
  }

  ACHIEVEMENT_TRACKS.forEach((track) => {
    const count = getTrackCount(track.id, stats, state);
    getTrackTiersThrough(track, count)
      .filter((value) => value <= count)
      .forEach((value) => unlock(trackAchievementId(track.id, value), stats.today));
  });

  return added;
}

async function evaluateInQueue() {
  const [rawState, stats] = await Promise.all([loadAchievementsState(), loadAchievementStats()]);
  const state = normalizeState(rawState);
  const firstRun = !state.initializedAt;

  const added = applyUnlocks(state, stats);
  state.bestStreakDays = Math.max(state.bestStreakDays, stats.streakDay);

  if (firstRun) {
    state.initializedAt = new Date().toISOString();
    state.welcome = added.length ? { count: added.length, date: stats.today } : null;
  } else if (added.length) {
    state.pending = [...state.pending, ...added.map((id) => ({ id }))];
  }

  const milestone = getStreakMilestoneProgress(stats.start, stats.today);
  if (milestone.reachedToday && state.lastStreakCelebration !== stats.today) {
    state.lastStreakCelebration = stats.today;
    const alreadyQueued = state.pending.some((item) => item.id === milestone.reachedToday.id);
    if (!firstRun && !alreadyQueued) {
      state.pending = [...state.pending, { id: milestone.reachedToday.id, again: true }];
    }
  }

  state.pointsHighWater = Math.max(state.pointsHighWater, computePoints(stats, state));

  await saveAchievementsState(state);
  return { state, stats };
}

/** Unlocks anything newly earned and returns the full view for Home and the Achievements screen. */
export function evaluateAchievements() {
  return enqueueAchievementsWrite(async () => {
    const { state, stats } = await evaluateInQueue();
    return buildAchievementsView(state, stats);
  });
}

export function dismissAchievementCelebrations() {
  return enqueueAchievementsWrite(async () => {
    const state = normalizeState(await loadAchievementsState());
    state.pending = [];
    state.welcome = null;
    await saveAchievementsState(state);
  });
}

/** Counted when someone gets through an urge without texting. */
export function recordUrgeResisted() {
  return enqueueAchievementsWrite(async () => {
    const state = normalizeState(await loadAchievementsState());
    state.urgesResisted += 1;
    await saveAchievementsState(state);
    return state.urgesResisted;
  });
}

/**
 * Restarts the no-contact streak while keeping every badge, the level, and lifetime days.
 * The ended streak's days move into lifetime totals (today becomes Day 1 of the new streak).
 */
export function resetStreakKeepingProgress() {
  return enqueueAchievementsWrite(async () => {
    const { state, stats } = await evaluateInQueue();
    state.pastStreakDays += Math.max(0, stats.streakDay - 1);
    state.bestStreakDays = Math.max(state.bestStreakDays, stats.streakDay);
    await saveAchievementsState(state);
    return resetNoContactStreak();
  });
}

// ——— View model ———

function streakDayColors(days) {
  const index = ALL_DAY_MILESTONES.indexOf(days);
  return TIER_COLORS[Math.min(Math.floor(Math.max(0, index) / 2), TIER_COLORS.length - 1)];
}

function buildStreakBadges(state, stats) {
  const badges = ALL_DAY_MILESTONES.map((days) => {
    const meta = getDayMilestoneMeta(days);
    const unlockedOn = state.unlocked[meta.id] || null;
    return {
      ...meta,
      daysNeeded: days,
      category: 'streak',
      title: meta.label,
      subtitle: meta.bonus ? 'Bonus milestone' : 'No contact',
      colors: streakDayColors(days),
      unlocked: Boolean(unlockedOn),
      unlockedOn,
      progress: unlockedOn ? 1 : Math.min(1, stats.streakDay / days),
      progressLabel: unlockedOn ? null : `Day ${stats.streakDay} of ${days}`,
      expectedOn: unlockedOn ? null : addDaysToDateKey(stats.start, days - 1),
    };
  });

  const highestUnlockedYear = Object.keys(state.unlocked)
    .filter((id) => id.startsWith('streak_year_'))
    .reduce((max, id) => Math.max(max, Number(id.slice('streak_year_'.length)) || 0), 0);
  const showThroughYear = Math.max(highestUnlockedYear, stats.completedYears) + 1;

  for (let year = 1; year <= showThroughYear; year += 1) {
    const meta = getYearMilestoneMeta(year);
    const unlockedOn = state.unlocked[meta.id] || null;
    const dateKey = addYearsToDateKey(stats.start, year);
    const daysNeeded = getStreakDayFromDateKeys(stats.start, dateKey);
    badges.push({
      ...meta,
      daysNeeded,
      category: 'streak',
      title: meta.label,
      subtitle: meta.crown ? 'Crown anniversary' : 'Anniversary',
      colors: meta.crown ? CROWN_COLORS : TIER_COLORS[TIER_COLORS.length - 1],
      unlocked: Boolean(unlockedOn),
      unlockedOn,
      progress: unlockedOn ? 1 : Math.min(1, stats.streakDay / daysNeeded),
      progressLabel: unlockedOn ? null : formatDateKey(dateKey),
      expectedOn: unlockedOn ? null : dateKey,
    });
  }

  return badges.sort((a, b) => a.daysNeeded - b.daysNeeded);
}

function buildTrackBadges(track, state, stats) {
  const count = getTrackCount(track.id, stats, state);
  const unlockedValues = Object.keys(state.unlocked)
    .map(parseTrackAchievementId)
    .filter((parsed) => parsed && parsed.track.id === track.id)
    .map((parsed) => parsed.value);
  const highest = Math.max(count, ...unlockedValues, 0);
  const values = getTrackTiersThrough(track, highest);
  const nextLocked = values.find((value) => !state.unlocked[trackAchievementId(track.id, value)]);

  return values
    .filter(
      (value) => state.unlocked[trackAchievementId(track.id, value)] || value === nextLocked
    )
    .map((value) => {
      const id = trackAchievementId(track.id, value);
      const unlockedOn = state.unlocked[id] || null;
      const tierIndex = values.indexOf(value);
      const unitWord = value === 1 ? track.unit[0] : track.unit[1];
      return {
        id,
        kind: 'track',
        trackId: track.id,
        value,
        category: track.category,
        icon: track.icon,
        title: `${value.toLocaleString('en-US')} ${unitWord}`,
        subtitle: track.title,
        colors: TIER_COLORS[tierIndex % TIER_COLORS.length],
        unlocked: Boolean(unlockedOn),
        unlockedOn,
        progress: unlockedOn ? 1 : Math.min(1, count / value),
        progressLabel: unlockedOn ? null : `${Math.min(count, value)} of ${value}`,
        celebration: track.celebrate(value),
      };
    });
}

function describeBadge(badge, again = false) {
  if (badge.kind === 'track') return badge.celebration;
  const message = getStreakCelebrationMessage(badge);
  return again ? `${message} You have reached this one before, and you did it again.` : message;
}

export function buildAchievementsView(state, stats) {
  const streakBadges = buildStreakBadges(state, stats);
  const trackBadges = ACHIEVEMENT_TRACKS.flatMap((track) => buildTrackBadges(track, state, stats));
  const allBadges = [...streakBadges, ...trackBadges];
  const badgeById = Object.fromEntries(allBadges.map((badge) => [badge.id, badge]));

  const categories = ACHIEVEMENT_CATEGORIES.map((category) => {
    const items = allBadges.filter((badge) => badge.category === category.id);
    return {
      ...category,
      items,
      unlockedCount: items.filter((badge) => badge.unlocked).length,
    };
  });

  const nextUp = allBadges
    .filter((badge) => !badge.unlocked)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 3);

  const celebrations = state.pending
    .map((item) => {
      const badge = badgeById[item.id];
      return badge ? { ...badge, again: Boolean(item.again), message: describeBadge(badge, item.again) } : null;
    })
    .filter(Boolean);

  return {
    level: getLevelInfo(state.pointsHighWater),
    streakDay: stats.streakDay,
    startDate: stats.start,
    milestone: getStreakMilestoneProgress(stats.start, stats.today),
    bestStreakDays: state.bestStreakDays,
    lifetimeDays: state.pastStreakDays + stats.streakDay,
    urgesResisted: state.urgesResisted,
    unlockedCount: Object.keys(state.unlocked).length,
    categories,
    nextUp,
    celebrations,
    welcome: state.welcome,
  };
}
