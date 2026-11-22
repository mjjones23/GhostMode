/**
 * Weekly Progress Report — supportive summaries from local activity data.
 * No medical diagnosis or clinical claims.
 */

import {
  CHECKIN_MOODS,
  getMoodDisplayLabel,
  normalizeMoodId,
} from '../content/dailyCheckInContent';
import { getRecoveryPlanWeekSummary } from './dailyRecoveryPlan';
import {
  getOrInitNoContactStart,
  getStreakDay,
  loadJournalEntries,
  loadMoodLogs,
} from './storage';

const DAY_MS = 24 * 60 * 60 * 1000;

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekDateKeys(referenceDate = new Date()) {
  const end = new Date(referenceDate);
  end.setHours(12, 0, 0, 0);
  const keys = [];
  for (let daysAgo = 6; daysAgo >= 0; daysAgo -= 1) {
    const d = new Date(end.getTime() - daysAgo * DAY_MS);
    keys.push(toDateKey(d));
  }
  return keys;
}

function entryDateKey(iso) {
  if (!iso || typeof iso !== 'string') return null;
  if (iso.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(iso)) {
    return iso.slice(0, 10);
  }
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return toDateKey(parsed);
}

function countInWeek(items, weekKeys, getKey) {
  const set = new Set(weekKeys);
  return items.filter((item) => set.has(getKey(item))).length;
}

function moodBreakdownForWeek(moodLogs, weekKeys) {
  const set = new Set(weekKeys);
  const counts = {};
  moodLogs.forEach((log) => {
    const key = entryDateKey(log.createdAt);
    if (!key || !set.has(key)) return;
    const mood = normalizeMoodId(log.mood);
    if (!mood) return;
    counts[mood] = (counts[mood] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([mood, count]) => ({ mood, count, label: getMoodDisplayLabel(mood) }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      const aIndex = CHECKIN_MOODS.findIndex((option) => option.id === a.mood);
      const bIndex = CHECKIN_MOODS.findIndex((option) => option.id === b.mood);
      return aIndex - bIndex;
    });
}

/**
 * Build a supportive weekly insight. Never claims clinical outcomes.
 */
export function buildWeeklyInsight(report) {
  if (!report) {
    return {
      tone: 'insufficient',
      headline: 'Not enough data yet',
      body: 'Check in a few times this week — your weekly report fills in as you use Ghost Mode.',
    };
  }

  const {
    journalCount,
    moodCount,
    planActivitiesCompleted,
    plansCompleted,
    streakDay,
    topMood,
  } = report;

  const checkIns = journalCount + moodCount;

  if (checkIns === 0 && planActivitiesCompleted === 0) {
    return {
      tone: 'insufficient',
      headline: 'Not enough data for a weekly report',
      body: 'Log a mood, write a short journal entry, or complete a recovery plan activity. We will summarize your week when there is something to celebrate.',
    };
  }

  if (plansCompleted >= 4 || planActivitiesCompleted >= 12) {
    return {
      tone: 'strong',
      headline: 'You showed up for yourself this week',
      body: `You finished ${plansCompleted} recovery plan day${
        plansCompleted === 1 ? '' : 's'
      } and ${planActivitiesCompleted} supportive activit${
        planActivitiesCompleted === 1 ? 'y' : 'ies'
      }. Consistency like this protects your peace — this is not therapy advice, just recognition of your effort.`,
    };
  }

  if (checkIns >= 3) {
    const moodBit = topMood
      ? ` Your most logged mood was ${topMood.label}. Feeling it does not mean you failed no-contact.`
      : '';
    return {
      tone: 'steady',
      headline: 'You stayed aware this week',
      body: `You checked in ${checkIns} times through moods and journal entries.${moodBit} Small check-ins add up.`,
    };
  }

  if (streakDay >= 7) {
    return {
      tone: 'streak',
      headline: `Day ${streakDay} of no contact`,
      body: 'Your streak is carrying this week even if check-ins were light. Opening the app and choosing yourself still counts.',
    };
  }

  return {
    tone: 'gentle',
    headline: 'A quiet start to the week',
    body: 'You have a little data logged. Keep using check-ins and your daily plan — next week’s report will have more to reflect on. Ghost Mode is support, not medical care.',
  };
}

export async function getWeeklyProgressReport(referenceDate = new Date()) {
  const weekKeys = getWeekDateKeys(referenceDate);
  const weekStart = weekKeys[0];
  const weekEnd = weekKeys[weekKeys.length - 1];

  const [startDate, journalEntries, moodLogs, planWeek] = await Promise.all([
    getOrInitNoContactStart(),
    loadJournalEntries(),
    loadMoodLogs(),
    getRecoveryPlanWeekSummary(),
  ]);

  const streakDay = getStreakDay(startDate);
  const journalCount = countInWeek(journalEntries, weekKeys, (entry) =>
    entryDateKey(entry.createdAt)
  );
  const moodCount = countInWeek(moodLogs, weekKeys, (entry) =>
    entryDateKey(entry.createdAt)
  );
  const moodBreakdown = moodBreakdownForWeek(moodLogs, weekKeys);
  const topMood = moodBreakdown[0] || null;

  const report = {
    weekStart,
    weekEnd,
    weekKeys,
    streakDay,
    journalCount,
    moodCount,
    checkInCount: journalCount + moodCount,
    planActivitiesCompleted: planWeek.activitiesCompleted,
    plansCompleted: planWeek.plansCompleted,
    planWeek,
    moodBreakdown,
    topMood,
    hasEnoughData: journalCount + moodCount > 0 || planWeek.activitiesCompleted > 0,
  };

  report.insight = buildWeeklyInsight(report);
  return report;
}
