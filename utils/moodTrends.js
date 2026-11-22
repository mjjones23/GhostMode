/**
 * Simple mood history trends for the Mood tab (local data only).
 */

import {
  getMoodDisplayLabel,
  normalizeMoodId,
} from '../content/dailyCheckInContent';

const DAY_MS = 24 * 60 * 60 * 1000;

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function entryDateKey(iso) {
  if (!iso || typeof iso !== 'string') return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso.slice(0, 10);
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return toDateKey(parsed);
}

/** Last N calendar days oldest→newest with mood counts and top mood. */
export function buildMoodTrend(moodLogs, days = 7, referenceDate = new Date()) {
  const end = new Date(referenceDate);
  end.setHours(12, 0, 0, 0);

  const dayKeys = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    dayKeys.push(toDateKey(new Date(end.getTime() - i * DAY_MS)));
  }

  const byDay = Object.fromEntries(
    dayKeys.map((key) => [key, { date: key, count: 0, moods: {} }])
  );

  (Array.isArray(moodLogs) ? moodLogs : []).forEach((log) => {
    const key = entryDateKey(log.createdAt);
    if (!key || !byDay[key]) return;
    const mood = normalizeMoodId(log.mood);
    if (!mood) return;
    byDay[key].count += 1;
    byDay[key].moods[mood] = (byDay[key].moods[mood] || 0) + 1;
  });

  const series = dayKeys.map((key) => {
    const row = byDay[key];
    const top = Object.entries(row.moods).sort((a, b) => b[1] - a[1])[0];
    return {
      date: key,
      dayLabel: new Date(`${key}T12:00:00`)
        .toLocaleDateString(undefined, { weekday: 'short' })
        .slice(0, 1),
      count: row.count,
      topMood: top ? top[0] : null,
      topMoodLabel: top ? getMoodDisplayLabel(top[0]) : null,
    };
  });

  const total = series.reduce((sum, day) => sum + day.count, 0);
  const maxCount = series.reduce((max, day) => Math.max(max, day.count), 0);
  const activeDays = series.filter((day) => day.count > 0).length;

  return {
    days,
    series,
    total,
    maxCount,
    activeDays,
    hasData: total > 0,
  };
}
