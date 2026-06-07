import {
  CHECKIN_MOODS,
  getMoodDisplayLabel,
  normalizeMoodId,
} from '../content/dailyCheckInContent';
import {
  getOrInitNoContactStart,
  loadJournalEntries,
  loadMoodLogs,
  getStreakDay,
} from './storage';

function normalizeMoodName(mood) {
  return normalizeMoodId(mood);
}

function getMoodBreakdown(moodLogs) {
  const counts = {};

  moodLogs.forEach((log) => {
    const mood = normalizeMoodName(log.mood);
    if (!mood) return;
    counts[mood] = (counts[mood] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([mood, count]) => ({ mood, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      const aIndex = CHECKIN_MOODS.findIndex((option) => option.id === a.mood);
      const bIndex = CHECKIN_MOODS.findIndex((option) => option.id === b.mood);
      if (aIndex === -1 && bIndex === -1) return a.mood.localeCompare(b.mood);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
}

function getMostCommonMood(moodLogs) {
  const breakdown = getMoodBreakdown(moodLogs);
  if (!breakdown.length) return null;

  const top = breakdown[0];
  return {
    mood: top.mood,
    count: top.count,
    breakdown,
  };
}

const MOOD_INSIGHTS = {
  hurting: 'Naming pain is brave. You are processing instead of suppressing.',
  anxious: 'Anxiety lies about urgency. You do not need to text them to feel safe.',
  'missing them':
    'Missing someone does not mean you made the wrong choice. You are allowed to feel it.',
  angry: 'Anger often protects a softer hurt underneath. You are allowed to feel it.',
  healing: 'Healing is showing up more for you. That is real progress.',
  confident: 'Hope is returning. Keep choosing the future over the past.',
};

export function buildProgressInsight({
  streakDay,
  journalCount,
  moodCount,
  mostCommonMood,
}) {
  const checkIns = journalCount + moodCount;
  const topMoodId = mostCommonMood?.mood;
  const topMoodLabel = topMoodId ? getMoodDisplayLabel(topMoodId) : null;
  const topMoodCount = mostCommonMood?.count || 0;

  if (checkIns >= 5) {
    if (topMoodId && topMoodCount >= 2 && MOOD_INSIGHTS[topMoodId]) {
      return `You've checked in with yourself ${checkIns} times. Your most common mood is ${topMoodLabel} — ${MOOD_INSIGHTS[topMoodId]}`;
    }
    return `You've checked in with yourself ${checkIns} times. That means you're choosing healing instead of reacting.`;
  }

  if (topMoodId && topMoodCount >= 2 && MOOD_INSIGHTS[topMoodId]) {
    return `Your most common mood is ${topMoodLabel} (${topMoodCount} logs). ${MOOD_INSIGHTS[topMoodId]}`;
  }

  if (checkIns >= 1) {
    const suffix =
      checkIns === 1
        ? 'Every check-in is a step away from impulsive texting.'
        : 'Keep choosing awareness over reaction.';
    return `You've checked in with yourself ${checkIns} times. ${suffix}`;
  }

  if (streakDay >= 14) {
    return `${streakDay} days of no contact. You're building real distance and protecting your peace.`;
  }

  if (streakDay >= 7) {
    return `One week strong on Day ${streakDay}. Consistency is how healing becomes your new normal.`;
  }

  if (streakDay >= 1) {
    return `Day ${streakDay} of no contact. Opening this app is already a step toward choosing yourself.`;
  }

  return 'Log a mood or write in your journal today. Small actions add up to real healing.';
}

export async function getProgressInsights() {
  const [startDate, journalEntries, moodLogs] = await Promise.all([
    getOrInitNoContactStart(),
    loadJournalEntries(),
    loadMoodLogs(),
  ]);

  const streakDay = getStreakDay(startDate);
  const journalCount = journalEntries.length;
  const moodCount = moodLogs.length;
  const mostCommonMood = getMostCommonMood(moodLogs);
  const latestJournalDate = journalEntries[0]?.createdAt || null;

  return {
    streakDay,
    journalCount,
    moodCount,
    mostCommonMood,
    moodBreakdown: mostCommonMood?.breakdown || [],
    latestJournalDate,
    insight: buildProgressInsight({
      streakDay,
      journalCount,
      moodCount,
      mostCommonMood,
    }),
  };
}
