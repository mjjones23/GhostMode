import {
  DAILY_PLAN_ACTIVITIES,
  PLAN_CATEGORIES,
  RECOVERY_STAGES,
} from '../content/dailyRecoveryPlan';
import { normalizeMoodId } from '../content/dailyCheckInContent';
import {
  getOrInitNoContactStart,
  getStreakDay,
  getTodayDateKey,
  getTodaysCheckIn,
  loadDailyPlans,
  loadMainGoal,
  saveDailyPlans,
} from './storage';

const ACTIVITY_BY_ID = Object.fromEntries(
  DAILY_PLAN_ACTIVITIES.map((activity) => [activity.id, activity])
);

const MIND_CATEGORIES = new Set(['journal', 'reflection']);
const BODY_CATEGORIES = new Set(['movement', 'self_care']);

const MOOD_GROUPS = {
  struggling: 'low',
  hurting: 'low',
  anxious: 'low',
  missing_them: 'longing',
  'missing them': 'longing',
  angry: 'angry',
  okay: 'steady',
  healing: 'steady',
  better: 'high',
  strong: 'high',
  confident: 'high',
};

const GOAL_TAGS = {
  'Stop texting them': 'boundaries',
  'Heal and move on': 'healing',
  'Build confidence': 'confidence',
  'Track my emotions': 'awareness',
};

const PLAN_SIZE = { low: 3, high: 5, default: 4 };

export function getRecoveryStage(streakDay) {
  const day = Math.max(1, Math.floor(Number(streakDay) || 1));
  return (
    RECOVERY_STAGES.find((stage) => day >= stage.minDays && day <= stage.maxDays) ||
    RECOVERY_STAGES[0]
  );
}

export function getRecoveryStageById(stageId) {
  return RECOVERY_STAGES.find((stage) => stage.id === stageId) || RECOVERY_STAGES[0];
}

export function getMoodGroup(mood) {
  if (!mood) return null;
  return MOOD_GROUPS[normalizeMoodId(mood)] || null;
}

function getGoalTag(goal) {
  return GOAL_TAGS[goal] || null;
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateKeyDaysAgo(daysAgo) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return toDateKey(date);
}

/** Stable 0–1 value per date + activity so plans vary daily but stay fixed within a day. */
function dailyJitter(dateKey, activityId) {
  const seed = `${dateKey}:${activityId}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return (hash % 1000) / 1000;
}

export function getPlanProgress(plan) {
  const ids = Array.isArray(plan?.activityIds) ? plan.activityIds : [];
  const completed = plan?.completed || {};
  const completedCount = ids.filter((id) => Boolean(completed[id])).length;
  const total = ids.length;
  return {
    completedCount,
    total,
    percent: total ? Math.round((completedCount / total) * 100) : 0,
    isComplete: total > 0 && completedCount === total,
  };
}

function scoreActivity(activity, { dateKey, moodGroup, goalTag, previousIds, lightDay }) {
  let score = dailyJitter(dateKey, activity.id) * 2;

  if (moodGroup && activity.moods.includes(moodGroup)) score += 3;
  if (goalTag && activity.goals.includes(goalTag)) score += 2;
  if (previousIds.has(activity.id)) score -= 4;

  if (lightDay) {
    if (activity.effort === 'gentle') score += 2;
    if (activity.effort === 'stretch') score -= 3;
  } else if (moodGroup === 'high' && activity.effort === 'stretch') {
    score += 1.5;
  }

  return score;
}

/**
 * Builds a 3–5 activity plan from streak stage, today's mood, setup goal,
 * and yesterday's plan (avoids repeats, eases off after a low-completion day).
 */
export function buildDailyPlan({ dateKey, streakDay, mood, goal, previousPlan }) {
  const stage = getRecoveryStage(streakDay);
  const moodGroup = getMoodGroup(mood);
  const goalTag = getGoalTag(goal);
  const previousIds = new Set(previousPlan?.activityIds || []);
  const previousProgress = previousPlan ? getPlanProgress(previousPlan) : null;

  const struggledYesterday =
    previousProgress != null &&
    previousProgress.total > 0 &&
    previousProgress.completedCount / previousProgress.total < 0.5;
  const lightDay = moodGroup === 'low' || (struggledYesterday && moodGroup !== 'high');

  let size = PLAN_SIZE[moodGroup] || PLAN_SIZE.default;
  if (lightDay) size = PLAN_SIZE.low;

  const ranked = DAILY_PLAN_ACTIVITIES.filter((activity) =>
    activity.stages.includes(stage.id)
  )
    .map((activity) => ({
      activity,
      score: scoreActivity(activity, { dateKey, moodGroup, goalTag, previousIds, lightDay }),
    }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.activity);

  const picked = [];
  const usedCategories = new Set();

  const take = (activity) => {
    picked.push(activity.id);
    usedCategories.add(activity.category);
  };

  const mind = ranked.find((activity) => MIND_CATEGORIES.has(activity.category));
  if (mind) take(mind);

  const body = ranked.find((activity) => BODY_CATEGORIES.has(activity.category));
  if (body) take(body);

  for (const activity of ranked) {
    if (picked.length >= size) break;
    if (!picked.includes(activity.id) && !usedCategories.has(activity.category)) {
      take(activity);
    }
  }

  for (const activity of ranked) {
    if (picked.length >= size) break;
    if (!picked.includes(activity.id)) take(activity);
  }

  return {
    date: dateKey,
    stage: stage.id,
    streakDay,
    mood: mood ? normalizeMoodId(mood) : null,
    goal: goal || null,
    activityIds: picked.slice(0, size),
    completed: {},
    createdAt: new Date().toISOString(),
  };
}

function resolvePlan(plan) {
  const activities = (plan.activityIds || [])
    .map((id) => ACTIVITY_BY_ID[id])
    .filter(Boolean)
    .map((activity) => ({
      ...activity,
      categoryMeta: PLAN_CATEGORIES[activity.category] || PLAN_CATEGORIES.reflection,
      completed: Boolean(plan.completed?.[activity.id]),
    }));

  return {
    ...plan,
    stageMeta: getRecoveryStageById(plan.stage),
    activities,
    progress: getPlanProgress(plan),
  };
}

let planWriteQueue = Promise.resolve();

function enqueuePlanWrite(task) {
  const run = planWriteQueue.then(task, task);
  planWriteQueue = run.catch(() => {});
  return run;
}

async function loadPlanContext() {
  const [start, checkIn, goal] = await Promise.all([
    getOrInitNoContactStart(),
    getTodaysCheckIn(),
    loadMainGoal(),
  ]);

  return {
    streakDay: getStreakDay(start),
    mood: checkIn?.mood ? normalizeMoodId(checkIn.mood) : null,
    goal,
  };
}

async function ensureTodaysPlan(plans) {
  const today = getTodayDateKey();
  const existing = plans[today];
  const context = await loadPlanContext();
  const stageId = getRecoveryStage(context.streakDay).id;

  if (existing) {
    const untouched = getPlanProgress(existing).completedCount === 0;
    const contextChanged =
      (context.mood && context.mood !== existing.mood) || stageId !== existing.stage;
    if (!untouched || !contextChanged) {
      return { plan: existing, changed: false };
    }
  }

  const plan = buildDailyPlan({
    dateKey: today,
    ...context,
    previousPlan: plans[getDateKeyDaysAgo(1)] || null,
  });
  return { plan, changed: true };
}

/**
 * Returns today's plan, creating it on the first open of a new day.
 * Untouched plans re-tailor if today's mood or streak stage changes.
 */
export function getTodaysRecoveryPlan() {
  return enqueuePlanWrite(async () => {
    const plans = await loadDailyPlans();
    const { plan, changed } = await ensureTodaysPlan(plans);

    if (changed) {
      await saveDailyPlans({ ...plans, [plan.date]: plan });
    }

    return resolvePlan(plan);
  });
}

export function toggleRecoveryPlanActivity(activityId) {
  return enqueuePlanWrite(async () => {
    const plans = await loadDailyPlans();
    const { plan, changed } = await ensureTodaysPlan(plans);

    if (!plan.activityIds.includes(activityId)) {
      if (changed) {
        await saveDailyPlans({ ...plans, [plan.date]: plan });
      }
      return resolvePlan(plan);
    }

    const completed = { ...(plan.completed || {}) };
    if (completed[activityId]) {
      delete completed[activityId];
    } else {
      completed[activityId] = new Date().toISOString();
    }

    const updated = { ...plan, completed };
    await saveDailyPlans({ ...plans, [updated.date]: updated });
    return resolvePlan(updated);
  });
}

/** Last 7 days (oldest first) for Progress Insights. */
export async function getRecoveryPlanWeekSummary() {
  const plans = await loadDailyPlans();
  const days = [];

  for (let daysAgo = 6; daysAgo >= 0; daysAgo -= 1) {
    const date = getDateKeyDaysAgo(daysAgo);
    const plan = plans[date];
    const progress = plan ? getPlanProgress(plan) : null;
    days.push({
      date,
      dayLabel: new Date(`${date}T12:00:00`)
        .toLocaleDateString(undefined, { weekday: 'short' })
        .slice(0, 1),
      total: progress?.total || 0,
      completedCount: progress?.completedCount || 0,
      isComplete: Boolean(progress?.isComplete),
    });
  }

  return {
    days,
    plansCompleted: days.filter((day) => day.isComplete).length,
    activitiesCompleted: days.reduce((sum, day) => sum + day.completedCount, 0),
  };
}
