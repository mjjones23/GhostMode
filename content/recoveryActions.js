/** Recovery action catalog for AI Coach suggestions. */
export const RECOVERY_ACTION_CATALOG = {
  journal: {
    id: 'journal',
    label: 'Journal',
    icon: 'book-outline',
    route: 'Journal',
    tip: 'Write what you wish you could text them — keep it on the page, not in their inbox.',
    keywords: [
      'journal',
      'write',
      'text',
      'message',
      'urge',
      'miss',
      'closure',
      'feel',
      'angry',
      'betray',
      'cheat',
    ],
  },
  walk: {
    id: 'walk',
    label: 'Take a walk',
    icon: 'walk-outline',
    tip: 'Ten minutes outside can help an urge peak and fade without you doing anything you regret.',
    keywords: [
      'walk',
      'lonely',
      'loneliness',
      'outside',
      'fresh air',
      'restless',
      'anxious',
      'anxiety',
      'stuck',
      'cabin',
    ],
  },
  hydration: {
    id: 'hydration',
    label: 'Drink water',
    icon: 'water-outline',
    tip: 'A glass of water and one slow breath — small resets matter when emotions run hot.',
    keywords: [
      'water',
      'hydrat',
      'thirst',
      'tired',
      'exhaust',
      'overwhelm',
      'panic',
      'shaky',
      'headache',
    ],
  },
  meditation: {
    id: 'meditation',
    label: 'Breathe',
    icon: 'leaf-outline',
    route: 'CrisisLock',
    tip: 'Slow your breath before you act. Four counts in, six counts out.',
    keywords: [
      'calm',
      'breathe',
      'breath',
      'meditat',
      'panic',
      'anxious',
      'anxiety',
      'overwhelm',
      'help me calm',
      'spiral',
    ],
  },
  gym: {
    id: 'gym',
    label: 'Go to the gym',
    icon: 'barbell-outline',
    tip: 'Channel the energy somewhere safe — a workout, push-ups, or a hard walk can discharge the urge.',
    keywords: [
      'gym',
      'workout',
      'exercise',
      'angry',
      'anger',
      'mad',
      'rage',
      'energy',
      'restless',
      'furious',
    ],
  },
  reading: {
    id: 'reading',
    label: 'Read',
    icon: 'reader-outline',
    tip: 'Give your mind a different lane for twenty minutes — a book beats scrolling their profile.',
    keywords: [
      'read',
      'reading',
      'book',
      'distract',
      'bored',
      'night',
      'late',
      'instagram',
      'scroll',
      'social',
      'profile',
    ],
  },
  call_friend: {
    id: 'call_friend',
    label: 'Call a friend',
    icon: 'call-outline',
    tip: 'Connection with someone who has your back can ease the urge without reopening the wrong door.',
    keywords: [
      'friend',
      'lonely',
      'alone',
      'isolated',
      'call',
      'talk',
      'someone',
      'support',
      'company',
      'reach out',
    ],
  },
  no_social_media: {
    id: 'no_social_media',
    label: 'No social media',
    icon: 'phone-portrait-outline',
    tip: 'Their profile is not closure. Put the phone down for twenty minutes and protect your peace.',
    keywords: [
      'instagram',
      'social',
      'scroll',
      'profile',
      'story',
      'snap',
      'tiktok',
      'stalk',
      'check',
      'feed',
      'online',
    ],
  },
};

const DEFAULT_ACTION_IDS = ['journal', 'walk', 'hydration', 'meditation'];

const ACTION_IDS = Object.keys(RECOVERY_ACTION_CATALOG);

function normalizeText(...parts) {
  return parts
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function scoreAction(action, text) {
  let score = 0;
  for (const keyword of action.keywords) {
    if (text.includes(keyword)) {
      score += keyword.includes(' ') ? 3 : 1;
    }
  }
  return score;
}

/**
 * Picks 3–4 recovery actions from user + coach text (no backend).
 */
export function getSuggestedRecoveryActions(userText, coachReply, limit = 4) {
  const text = normalizeText(userText, coachReply);
  const max = Math.min(Math.max(limit, 3), 4);

  const ranked = ACTION_IDS.map((id) => ({
    id,
    score: scoreAction(RECOVERY_ACTION_CATALOG[id], text),
  }))
    .sort((a, b) => b.score - a.score);

  const picked = [];
  for (const entry of ranked) {
    if (entry.score > 0 && !picked.includes(entry.id)) {
      picked.push(entry.id);
    }
    if (picked.length >= max) break;
  }

  for (const fallbackId of DEFAULT_ACTION_IDS) {
    if (picked.length >= max) break;
    if (!picked.includes(fallbackId)) {
      picked.push(fallbackId);
    }
  }

  for (const entry of ranked) {
    if (picked.length >= max) break;
    if (!picked.includes(entry.id)) {
      picked.push(entry.id);
    }
  }

  return picked.slice(0, max).map((id) => RECOVERY_ACTION_CATALOG[id]);
}

export function getRecoveryActionsByIds(ids) {
  if (!Array.isArray(ids)) return [];
  return ids
    .map((id) => RECOVERY_ACTION_CATALOG[id])
    .filter(Boolean);
}
