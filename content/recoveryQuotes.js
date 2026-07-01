/** 50 local recovery quotes across five categories. */
export const QUOTE_CATEGORIES = [
  'no-contact',
  'self-respect',
  'discipline',
  'confidence',
  'healing',
];

export const QUOTE_CATEGORY_LABELS = {
  'no-contact': 'No contact',
  'self-respect': 'Self-respect',
  discipline: 'Discipline',
  confidence: 'Confidence',
  healing: 'Healing',
};

export const RECOVERY_QUOTES = [
  { text: 'Missing them is a habit your heart is unlearning.', category: 'no-contact' },
  { text: 'No contact is not punishment — it is protection.', category: 'no-contact' },
  { text: 'Every day you do not reach out, you choose yourself again.', category: 'no-contact' },
  { text: 'You survived the breakup. You can survive the urge to text.', category: 'no-contact' },
  { text: 'Grief for what could have been is human. Texting them is optional.', category: 'no-contact' },
  { text: 'One text can undo weeks of progress. One pause can save it.', category: 'no-contact' },
  { text: 'No contact is a daily decision, not a one-time promise.', category: 'no-contact' },
  { text: 'Their silence is an answer. Your peace is the response.', category: 'no-contact' },
  { text: 'You cannot heal in a loop with the person who hurt you.', category: 'no-contact' },
  { text: 'The urge to text is not proof you should — it is proof you are human.', category: 'no-contact' },
  { text: 'You do not need their presence to prove you mattered.', category: 'self-respect' },
  { text: 'The relationship ended. Your dignity does not have to.', category: 'self-respect' },
  { text: 'Self-respect is silence when they expect you to chase.', category: 'self-respect' },
  { text: 'You teach people how to treat you by what you tolerate.', category: 'self-respect' },
  { text: 'Going back would teach them your boundaries are negotiable.', category: 'self-respect' },
  { text: 'You deserve consistency, not crumbs.', category: 'self-respect' },
  { text: 'Protecting your peace is not selfish.', category: 'self-respect' },
  { text: 'You owe yourself the same loyalty you gave them.', category: 'self-respect' },
  { text: 'Self-respect sounds like: I will not beg for basic care.', category: 'self-respect' },
  { text: 'You are not hard to love — you are hard to manipulate when you know your worth.', category: 'self-respect' },
  { text: 'Discipline is choosing future you over tonight\'s urge.', category: 'discipline' },
  { text: 'Self-control is not coldness — it is loyalty to yourself.', category: 'discipline' },
  { text: 'The urge is loud. Your values are louder if you listen.', category: 'discipline' },
  { text: 'Wait ten minutes before you act on any impulse to contact them.', category: 'discipline' },
  { text: 'Strength is doing the hard thing when nobody is watching.', category: 'discipline' },
  { text: 'You are training your nervous system to feel safe without them.', category: 'discipline' },
  { text: 'Every no to them is a yes to your own life.', category: 'discipline' },
  { text: 'Discipline today is freedom tomorrow.', category: 'discipline' },
  { text: 'The urge will peak. Your job is to outlast it, not obey it.', category: 'discipline' },
  { text: 'Small boundaries repeated become a new identity.', category: 'discipline' },
  { text: 'You are enough without anyone confirming it.', category: 'confidence' },
  { text: 'Confidence grows every time you honor your own boundaries.', category: 'confidence' },
  { text: 'You have survived harder days than this one.', category: 'confidence' },
  { text: 'Your worth was never tied to their attention.', category: 'confidence' },
  { text: 'Walking away from what hurt you is brave, not failure.', category: 'confidence' },
  { text: 'You do not need to be chosen by them to choose yourself.', category: 'confidence' },
  { text: 'The right person will not require you to lose yourself.', category: 'confidence' },
  { text: 'You are becoming someone you can trust.', category: 'confidence' },
  { text: 'Every day in Ghost Mode is proof you can rely on you.', category: 'confidence' },
  { text: 'Your comeback does not need an audience.', category: 'confidence' },
  { text: 'You are not weak for grieving someone who was not good for you.', category: 'healing' },
  { text: 'The version of you that wants to go back is tired, not broken.', category: 'healing' },
  { text: 'Closure is something you give yourself, not something they owe you.', category: 'healing' },
  { text: 'Letting go does not mean the love was fake. It means your future is real.', category: 'healing' },
  { text: 'You are building a life that does not revolve around their approval.', category: 'healing' },
  { text: 'Healing happens in the space where you stop reopening old wounds.', category: 'healing' },
  { text: 'Choosing yourself is the most romantic thing you can do right now.', category: 'healing' },
  { text: 'You are the home you have been waiting to return to.', category: 'healing' },
  { text: 'Stand tall in the life you are creating, not the one they left.', category: 'healing' },
  { text: 'You are not behind — you are rebuilding on purpose.', category: 'healing' },
];

function safeQuoteIndex(index) {
  if (!RECOVERY_QUOTES.length) return 0;
  return ((index % RECOVERY_QUOTES.length) + RECOVERY_QUOTES.length) % RECOVERY_QUOTES.length;
}

export function getRecoveryQuoteByIndex(index) {
  const entry = RECOVERY_QUOTES[safeQuoteIndex(index)];
  return entry?.text ?? '';
}

export function getRecoveryQuoteCategoryByIndex(index) {
  const entry = RECOVERY_QUOTES[safeQuoteIndex(index)];
  return entry?.category ?? 'healing';
}

export function getRecoveryQuoteMetaByIndex(index) {
  const safeIndex = safeQuoteIndex(index);
  return {
    quote: getRecoveryQuoteByIndex(safeIndex),
    category: getRecoveryQuoteCategoryByIndex(safeIndex),
    quoteIndex: safeIndex,
  };
}

export function pickQuoteIndexForDate(dateKey, excludeIndex = null) {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i += 1) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0;
  }

  let index = hash % RECOVERY_QUOTES.length;
  if (
    excludeIndex !== null &&
    index === excludeIndex &&
    RECOVERY_QUOTES.length > 1
  ) {
    index = (index + 1) % RECOVERY_QUOTES.length;
  }
  return index;
}

export function pickNewQuoteIndex(currentIndex) {
  if (RECOVERY_QUOTES.length <= 1) return 0;

  let next = currentIndex;
  while (next === currentIndex) {
    next = Math.floor(Math.random() * RECOVERY_QUOTES.length);
  }
  return next;
}
