/**
 * Calendar-date helpers for streaks and anniversaries.
 * Date keys are local calendar dates ("YYYY-MM-DD"). All math works on the
 * calendar date itself (never hours or milliseconds of local time), so daylight
 * saving shifts and time-of-day can never move a streak by a day.
 */

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86400000;

export function toDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function daysAgoDateKey(daysAgo, from = new Date()) {
  const date = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  date.setDate(date.getDate() - daysAgo);
  return toDateKey(date);
}

export function parseDateKey(key) {
  const match = DATE_KEY_PATTERN.exec(String(key || ''));
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    return null;
  }
  return { year, month, day };
}

export function isValidDateKey(key) {
  return parseDateKey(key) != null;
}

export function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function toDayNumber({ year, month, day }) {
  return Math.round(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

function fromDayNumber(dayNumber) {
  const date = new Date(dayNumber * MS_PER_DAY);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Whole calendar days from one date key to another (negative if `to` is earlier). */
export function daysBetween(fromKey, toKey) {
  const from = parseDateKey(fromKey);
  const to = parseDateKey(toKey);
  if (!from || !to) return 0;
  return toDayNumber(to) - toDayNumber(from);
}

export function addDaysToDateKey(key, days) {
  const parts = parseDateKey(key);
  if (!parts) return key;
  return fromDayNumber(toDayNumber(parts) + days);
}

/**
 * Same month and day, `years` later. A Feb 29 start lands on Feb 28 in
 * non-leap years so the anniversary is never celebrated late.
 */
export function addYearsToDateKey(key, years) {
  const parts = parseDateKey(key);
  if (!parts) return key;
  const year = parts.year + years;
  const day =
    parts.month === 2 && parts.day === 29 && !isLeapYear(year) ? 28 : parts.day;
  return `${year}-${String(parts.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Streak day number where the start date itself is Day 1. Never below 1. */
export function getStreakDayFromDateKeys(startKey, todayKey) {
  if (!isValidDateKey(startKey) || !isValidDateKey(todayKey)) return 1;
  return Math.max(1, daysBetween(startKey, todayKey) + 1);
}

/** Number of calendar anniversaries on or before today. */
export function getCompletedYears(startKey, todayKey) {
  const start = parseDateKey(startKey);
  const today = parseDateKey(todayKey);
  if (!start || !today || todayKey < startKey) return 0;

  let years = today.year - start.year;
  if (years > 0 && addYearsToDateKey(startKey, years) > todayKey) years -= 1;
  return Math.max(0, years);
}

export function formatDateKey(key, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
  const parts = parseDateKey(key);
  if (!parts) return '';
  return new Date(parts.year, parts.month - 1, parts.day).toLocaleDateString(
    'en-US',
    options
  );
}

export function dateKeyFromIso(isoString) {
  if (!isoString) return null;
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return null;
  return toDateKey(date);
}
