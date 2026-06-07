/**
 * Mock coach replies — used when OpenAI is off or fails.
 */

const GENERAL_HEALING_REPLIES = [
  "What you're feeling is valid. Staying in Ghost Mode is an act of self-respect, even when it hurts.",
  "The urge will peak and fade. You don't have to act on every feeling — you just have to ride this one out.",
  "You chose space for a reason. Trust the version of you that needed room to heal.",
];

const REPLIES = {
  missThem:
    "Missing them is real — and it doesn't erase your progress. Your brain is craving familiarity, not necessarily what was good for you. Sit with the feeling for five minutes before you do anything.",
  textThem:
    "Before you text them, pause for ten minutes. Write in your journal first — you can ride this urge out without sending a message.",
  angry:
    "Anger is allowed here. Slow your breath — in for four, out for six. You don't have to send a message to release this feeling.",
  lonely:
    "Loneliness can feel huge, but it doesn't mean you are alone in your healing. Reach for something gentle tonight: water, a short walk, or one line in your journal.",
  calmDown:
    "Let's slow down together. Breathe in for 4 counts, hold for 4, out for 6. The urge to reach out is a spike — it will pass.",
};

function includesAny(text, words) {
  return words.some((word) => text.includes(word));
}

function getMockReply(userText) {
  const normalized = String(userText || '').trim().toLowerCase();

  if (!normalized) {
    return GENERAL_HEALING_REPLIES[0];
  }

  if (includesAny(normalized, ['miss', 'missing', 'think about them', 'think of them'])) {
    return REPLIES.missThem;
  }
  if (includesAny(normalized, ['text', 'message', 'call', 'reach out', 'contact'])) {
    return REPLIES.textThem;
  }
  if (includesAny(normalized, ['angry', 'anger', 'mad', 'furious'])) {
    return REPLIES.angry;
  }
  if (includesAny(normalized, ['lonely', 'alone', 'empty'])) {
    return REPLIES.lonely;
  }
  if (includesAny(normalized, ['calm', 'breathe', 'panic', 'anxious', 'anxiety'])) {
    return REPLIES.calmDown;
  }

  const index = Math.abs(normalized.length) % GENERAL_HEALING_REPLIES.length;
  return `I hear you. ${GENERAL_HEALING_REPLIES[index]}`;
}

module.exports = { getMockReply };
