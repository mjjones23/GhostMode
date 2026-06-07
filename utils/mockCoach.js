export const MOCK_COACH_ERROR_FALLBACK =
  "I'm still here with you. Something went wrong on my side — take a slow breath, and try sending your message again when you're ready.";

const GENERAL_HEALING_REPLIES = [
  "What you're feeling is valid. Staying in Ghost Mode is an act of self-respect, even when it hurts.",
  "The urge will peak and fade. You don't have to act on every feeling — you just have to ride this one out.",
  "You chose space for a reason. Trust the version of you that needed room to heal.",
  "One text won't rewrite the ending. But every day you stay strong rewrites your future.",
  "You are allowed to protect your peace, even when your heart is loud tonight.",
];

const REPLIES = {
  missThem:
    "Missing them is real — and it doesn't erase your progress. Your brain is craving familiarity, not necessarily what was good for you. Sit with the feeling for five minutes before you do anything. You are stronger than this wave.",
  textThem:
    "Before you text them, pause for ten minutes. Write down what you hope the message will fix — then ask if texting will actually give you that. Open your Journal tab and put the words there first. You can ride this urge out.",
  angry:
    "Anger is allowed here. Slow your breath — in for four, out for six. You don't have to send a message to release this feeling. Let it move through you without reaching for your phone.",
  lonely:
    "Loneliness can feel huge, but it doesn't mean you are alone in this app or in your healing. Reach for something gentle tonight: water, a shower, a short walk, or one line in your journal. This feeling will soften.",
  calmDown:
    "Let's slow down together. Breathe in for 4 counts, hold for 4, out for 6. The urge to reach out is a spike — it will pass. You have survived every hard moment so far. I'm right here with you.",
};

function includesAny(text, words) {
  return words.some((word) => text.includes(word));
}

/**
 * Returns a supportive mock coach reply based on keywords in the user's message.
 * Safe to call with any input — always returns a string.
 */
export function getMockReply(userText) {
  try {
    const normalized = String(userText || '').trim().toLowerCase();

    if (!normalized) {
      return GENERAL_HEALING_REPLIES[0];
    }

    if (
      normalized.includes('miss') &&
      includesAny(normalized, ['them', 'him', 'her', 'ex'])
    ) {
      return REPLIES.missThem;
    }

    if (
      includesAny(normalized, ['text them', 'text him', 'text her', 'message them']) ||
      (normalized.includes('text') &&
        includesAny(normalized, ['them', 'him', 'her', 'ex']))
    ) {
      return REPLIES.textThem;
    }

    if (includesAny(normalized, ['angry', 'mad', 'furious', 'rage'])) {
      return REPLIES.angry;
    }

    if (includesAny(normalized, ['lonely', 'loneliness', 'alone', 'isolated'])) {
      return REPLIES.lonely;
    }

    if (
      includesAny(normalized, [
        'help me calm down',
        'calm me down',
        'calm down',
        'need to calm',
      ])
    ) {
      return REPLIES.calmDown;
    }

    const index = Math.abs(normalized.length + normalized.charCodeAt(0)) % GENERAL_HEALING_REPLIES.length;
    return `I hear you. ${GENERAL_HEALING_REPLIES[index]}`;
  } catch {
    return MOCK_COACH_ERROR_FALLBACK;
  }
}

/** Alias used by older coach API fallback code. */
export const getMockCoachReply = getMockReply;
