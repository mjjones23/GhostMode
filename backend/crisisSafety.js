const CRISIS_PATTERNS = [
  /\bkill\s+myself\b/i,
  /\bkill\s+me\b/i,
  /\bend\s+my\s+life\b/i,
  /\bwant\s+to\s+die\b/i,
  /\bwish\s+i\s+(was|were)\s+dead\b/i,
  /\bself[\s-]?harm\b/i,
  /\bhurt\s+myself\b/i,
  /\bsuicid/i,
  /\bno\s+reason\s+to\s+live\b/i,
  /\bcan'?t\s+go\s+on\b/i,
];

const CRISIS_REPLY =
  'Ghost Mode is not crisis support. If you may hurt yourself or feel unsafe, contact emergency services now. If you are in the U.S. or Canada, call or text 988 right now.';

function detectCrisis(text) {
  if (!text || typeof text !== 'string') return false;
  return CRISIS_PATTERNS.some((pattern) => pattern.test(text));
}

module.exports = { detectCrisis, CRISIS_REPLY };
