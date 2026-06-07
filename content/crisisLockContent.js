export const CALMING_MESSAGES = [
  'This urge is a wave — it will pass.',
  'You do not have to act on every feeling.',
  'Pause is power. You are choosing yourself.',
  'Missing them is real. Texting them is optional.',
  'Your future self will thank you for waiting.',
  'One breath at a time. You are safe right now.',
];

export const SUPPORT_MESSAGES = [
  "I'm right here with you. You don't need to text them to prove you care.",
  'The urge feels urgent, but it rarely gives you the closure you want.',
  'You broke no-contact for a reason. Protecting your peace is not weakness.',
  'Sit with the feeling for a few minutes — it loses strength when you breathe through it.',
  'You have survived every hard moment before this one. You can survive this one too.',
  'Texting might feel like relief for a minute. Healing lasts much longer.',
];

export const FALLBACK_REASON =
  'You chose no-contact to heal. Going back now would cost you the progress you fought for.';

export const RECOVERY_COUNTDOWN_SECONDS = 90;
export const PAUSE_COUNTDOWN_SECONDS = 10 * 60;

export function getRandomSupportMessage() {
  const index = Math.floor(Math.random() * SUPPORT_MESSAGES.length);
  return SUPPORT_MESSAGES[index];
}

export function getCalmingMessage(index) {
  return CALMING_MESSAGES[index % CALMING_MESSAGES.length];
}

export function formatCountdown(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
