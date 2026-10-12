/** Achievements & Levels content (v1.2.0). Every track keeps going — there is no final tier. */

export const ACHIEVEMENT_CATEGORIES = [
  {
    id: 'streak',
    title: 'No-Contact Milestones',
    subtitle: 'Every milestone you reach is yours to keep.',
    icon: 'shield-checkmark',
  },
  {
    id: 'plans',
    title: 'Daily Recovery Plans',
    subtitle: 'Small daily actions add up.',
    icon: 'list-circle',
  },
  {
    id: 'journal',
    title: 'Journaling',
    subtitle: 'Any day you write counts. Missed days never undo progress.',
    icon: 'book',
  },
  {
    id: 'habits',
    title: 'Positive Habits',
    subtitle: 'The choices that move you forward.',
    icon: 'leaf',
  },
];

/**
 * tiers: first values, then the ladder keeps growing by `repeatEvery` forever.
 */
export const ACHIEVEMENT_TRACKS = [
  {
    id: 'plans_completed',
    category: 'plans',
    title: 'Plans Completed',
    icon: 'checkmark-done-circle',
    unit: ['full plan', 'full plans'],
    tiers: [1, 7, 30, 60, 100, 200, 365],
    repeatEvery: 365,
    celebrate: (n) =>
      n === 1
        ? 'You finished your first full recovery plan. That is showing up for yourself.'
        : `${n} full plans completed. Your consistency is building something real.`,
  },
  {
    id: 'plan_activities',
    category: 'plans',
    title: 'Plan Activities',
    icon: 'checkbox',
    unit: ['activity', 'activities'],
    tiers: [10, 50, 100, 250, 500, 1000],
    repeatEvery: 1000,
    celebrate: (n) => `${n} recovery activities done. Every one was a choice for you.`,
  },
  {
    id: 'journal_entries',
    category: 'journal',
    title: 'Entries Written',
    icon: 'create',
    unit: ['entry', 'entries'],
    tiers: [1, 10, 25, 50, 100, 250, 500],
    repeatEvery: 250,
    celebrate: (n) =>
      n === 1
        ? 'Your first journal entry. Putting it on the page instead of in a text matters.'
        : `${n} journal entries. You are processing instead of reacting.`,
  },
  {
    id: 'journal_days',
    category: 'journal',
    title: 'Days Journaled',
    icon: 'calendar',
    unit: ['day', 'days'],
    tiers: [7, 30, 60, 100, 200, 365],
    repeatEvery: 365,
    celebrate: (n) => `You have journaled on ${n} different days. That is real self-awareness.`,
  },
  {
    id: 'checkin_days',
    category: 'habits',
    title: 'Mood Check-ins',
    icon: 'heart',
    unit: ['day', 'days'],
    tiers: [7, 30, 100, 365],
    repeatEvery: 365,
    celebrate: (n) => `${n} days of checking in with yourself. Noticing is how healing starts.`,
  },
  {
    id: 'movement',
    category: 'habits',
    title: 'Moved Your Body',
    icon: 'walk',
    unit: ['time', 'times'],
    tiers: [5, 25, 100],
    repeatEvery: 100,
    celebrate: (n) => `You moved your body ${n} times. Your mind feels that too.`,
  },
  {
    id: 'self_care',
    category: 'habits',
    title: 'Self-Care',
    icon: 'flower',
    unit: ['time', 'times'],
    tiers: [5, 25, 100],
    repeatEvery: 100,
    celebrate: (n) => `${n} acts of self-care. You are learning to take care of you.`,
  },
  {
    id: 'connection',
    category: 'habits',
    title: 'Reached Out',
    icon: 'people',
    unit: ['time', 'times'],
    tiers: [3, 10, 50],
    repeatEvery: 50,
    celebrate: (n) => `You reached out ${n} times. Connection is strength, not weakness.`,
  },
  {
    id: 'reasons_saved',
    category: 'habits',
    title: 'Reasons Saved',
    icon: 'shield-checkmark',
    unit: ['reason', 'reasons'],
    tiers: [1, 5, 10, 25],
    repeatEvery: 25,
    celebrate: (n) =>
      n === 1
        ? 'You saved your first reason. Future you will thank you.'
        : `${n} reasons saved. You know exactly why you chose this.`,
  },
  {
    id: 'urges_resisted',
    category: 'habits',
    title: 'Urges Resisted',
    icon: 'hand-left',
    unit: ['urge', 'urges'],
    tiers: [1, 5, 25, 100],
    repeatEvery: 100,
    celebrate: (n) =>
      n === 1
        ? 'You felt the urge and did not text. That is huge.'
        : `${n} urges resisted. Each one proves you are stronger than the moment.`,
  },
];

/** Medal colors by tier — purple family that warms to gold at higher tiers, then cycles. */
export const TIER_COLORS = [
  { ring: '#a78bfa', glow: '#7c3aed', fill: 'rgba(124, 58, 237, 0.22)', icon: '#e9d5ff' },
  { ring: '#c4b5fd', glow: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.24)', icon: '#f5f3ff' },
  { ring: '#f0abfc', glow: '#c026d3', fill: 'rgba(192, 38, 211, 0.2)', icon: '#fdf4ff' },
  { ring: '#93c5fd', glow: '#6366f1', fill: 'rgba(99, 102, 241, 0.22)', icon: '#eef2ff' },
  { ring: '#fde68a', glow: '#d97706', fill: 'rgba(217, 119, 6, 0.18)', icon: '#fffbeb' },
];

export const CROWN_COLORS = {
  ring: '#fde68a',
  glow: '#f59e0b',
  fill: 'rgba(245, 158, 11, 0.2)',
  icon: '#fef3c7',
};

export const LEVEL_NAMES = [
  'Seedling',
  'Sprout',
  'Steady Ground',
  'Rising',
  'Rebuilding',
  'Strong Roots',
  'Radiant',
  'Free Spirit',
  'Unbreakable',
  'Luminary',
];

export const LEVEL_POINTS = {
  noContactDay: 10,
  planActivity: 5,
  planComplete: 10,
  journalDay: 10,
  checkInDay: 5,
  urgeResisted: 20,
  achievement: 25,
};

export const LEVEL_ENCOURAGEMENT = [
  'Every day you choose yourself counts.',
  'Progress, not perfection.',
  'Your growth is real, and it is yours to keep.',
  'Hard days do not erase how far you have come.',
];
