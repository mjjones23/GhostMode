/** 30 supportive messages shown one per day on the Home dashboard. */
export const HEALING_MESSAGES = [
  'You do not need to reopen a door that hurt you.',
  'Missing them does not mean you made the wrong choice.',
  'Healing is not linear — showing up today still counts.',
  'Your peace is worth more than one more conversation.',
  'The urge to text will pass. Your dignity stays.',
  'You are allowed to outgrow what once felt like home.',
  'Silence is not weakness. It is self-respect in action.',
  'You do not owe anyone access to your heart on demand.',
  'Every day without contact is proof you can choose yourself.',
  'Letting go does not mean you never cared. It means you care about yourself too.',
  'Their absence is making space for the life you deserve.',
  'You are not starting over. You are starting smarter.',
  'Closure does not always come from them. Sometimes it comes from you.',
  'Staying away is an act of love toward future you.',
  'You survived every hard night so far. You will survive this one.',
  'Not texting them tonight is a win. Celebrate that.',
  'Your worth was never measured by whether they stayed.',
  'It is okay to grieve while still moving forward.',
  'You are building a version of you that does not need their validation.',
  'The part of you that wants to text back is tired. Rest looks like no contact.',
  'You cannot heal in the same place that broke you.',
  'Choose long-term peace over short-term relief.',
  'What is meant for you will not require you to lose yourself.',
  'You are stronger than the habit of going back.',
  'One day this ache will be a chapter, not your whole story.',
  'Protect your energy like something precious — because it is.',
  'You do not need their apology to begin your healing.',
  'Tonight, be loyal to yourself instead of the fantasy.',
  'Small steps away from them are giant steps toward you.',
  'Ghost Mode is not about them missing you. It is about you finding you.',
];

export function getHealingMessageByIndex(index) {
  if (!HEALING_MESSAGES.length) return '';
  const safeIndex =
    ((index % HEALING_MESSAGES.length) + HEALING_MESSAGES.length) %
    HEALING_MESSAGES.length;
  return HEALING_MESSAGES[safeIndex];
}

/** Same date always picks the same message (until user taps New Message). */
export function pickMessageIndexForDate(dateKey, excludeIndex = null) {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i += 1) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0;
  }

  let index = hash % HEALING_MESSAGES.length;
  if (
    excludeIndex !== null &&
    index === excludeIndex &&
    HEALING_MESSAGES.length > 1
  ) {
    index = (index + 1) % HEALING_MESSAGES.length;
  }
  return index;
}

export function pickNewMessageIndex(currentIndex) {
  if (HEALING_MESSAGES.length <= 1) return 0;

  let next = currentIndex;
  while (next === currentIndex) {
    next = Math.floor(Math.random() * HEALING_MESSAGES.length);
  }
  return next;
}
