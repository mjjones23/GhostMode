export const CHECKIN_MOODS = [
  {
    id: 'hurting',
    label: 'Hurting',
    emoji: '💔',
    color: '#f9a8d4',
    bg: 'rgba(244, 114, 182, 0.14)',
    border: 'rgba(244, 114, 182, 0.35)',
  },
  {
    id: 'anxious',
    label: 'Anxious',
    emoji: '😰',
    color: '#c4b5fd',
    bg: 'rgba(167, 139, 250, 0.14)',
    border: 'rgba(167, 139, 250, 0.35)',
  },
  {
    id: 'missing them',
    label: 'Missing them',
    emoji: '🥺',
    color: '#93c5fd',
    bg: 'rgba(147, 197, 253, 0.12)',
    border: 'rgba(147, 197, 253, 0.32)',
  },
  {
    id: 'angry',
    label: 'Angry',
    emoji: '😤',
    color: '#fca5a5',
    bg: 'rgba(248, 113, 113, 0.12)',
    border: 'rgba(248, 113, 113, 0.32)',
  },
  {
    id: 'healing',
    label: 'Healing',
    emoji: '🌱',
    color: '#86efac',
    bg: 'rgba(134, 239, 172, 0.1)',
    border: 'rgba(134, 239, 172, 0.3)',
  },
  {
    id: 'confident',
    label: 'Confident',
    emoji: '✨',
    color: '#fde68a',
    bg: 'rgba(253, 230, 138, 0.1)',
    border: 'rgba(253, 230, 138, 0.28)',
  },
];

export const CHECKIN_SUPPORT_MESSAGES = {
  hurting:
    'Pain is real, and you do not have to carry it alone tonight. Checking in is a brave step — be as gentle with yourself as you would a friend.',
  anxious:
    'Anxiety lies about urgency. You do not need to text them to feel safe. Slow your breath. This moment will move through you.',
  'missing them':
    'Missing someone does not mean you made the wrong choice. Your heart is adjusting to space — that ache is part of healing, not proof you should go back.',
  angry:
    'Anger often protects a softer hurt underneath. You are allowed to feel it without sending a message you might regret. Let it pass through, not out.',
  healing:
    'You are doing something hard and doing it anyway. Healing is not linear — days like this prove you are moving forward.',
  confident:
    'Look at you — choosing yourself again today. Confidence in no-contact is built one small decision at a time. Keep going.',
};

export function getCheckInMoodMeta(moodId) {
  return CHECKIN_MOODS.find((m) => m.id === moodId) ?? null;
}

export function getCheckInSupportMessage(moodId) {
  return CHECKIN_SUPPORT_MESSAGES[moodId] ?? 'Thank you for checking in with yourself today.';
}

const LEGACY_MOOD_MAP = {
  Sad: 'hurting',
  Angry: 'angry',
  Lonely: 'missing them',
  Calm: 'healing',
  Hopeful: 'confident',
};

export function normalizeMoodId(mood) {
  const trimmed = String(mood || '').trim();
  if (!trimmed) return '';

  if (LEGACY_MOOD_MAP[trimmed]) {
    return LEGACY_MOOD_MAP[trimmed];
  }

  const match = CHECKIN_MOODS.find(
    (option) =>
      option.id === trimmed ||
      option.label.toLowerCase() === trimmed.toLowerCase()
  );
  return match?.id || trimmed;
}

export function getMoodDisplayLabel(moodId) {
  return getCheckInMoodMeta(normalizeMoodId(moodId))?.label || moodId;
}
