/**
 * Local unit tests for AI Coach personalization context (no OpenAI / Railway).
 * Run: node backend/test-coach-context.js
 */
const assert = require('assert');
const {
  sanitizeCoachContext,
  formatContextForPrompt,
} = require('./coachContext');
const { detectCrisis, CRISIS_REPLY } = require('./crisisSafety');
const { buildOpenAIMessages } = require('./openaiCoach');
const { formatContextForPrompt: formatCtx } = require('./coachContext');

let passed = 0;
let failed = 0;

function check(name, condition, detail) {
  if (condition) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`FAIL  ${name}${detail !== undefined ? ` → ${JSON.stringify(detail)}` : ''}`);
  }
}

function eq(name, actual, expected) {
  try {
    assert.deepStrictEqual(actual, expected);
    check(name, true);
  } catch {
    check(name, false, { actual, expected });
  }
}

// --- Opt-out / missing ---
eq('null context', sanitizeCoachContext(null), null);
eq('undefined context', sanitizeCoachContext(undefined), null);
eq('empty object', sanitizeCoachContext({}), null);
eq('array rejected', sanitizeCoachContext([{ streakDay: 3 }]), null);
eq('string rejected', sanitizeCoachContext('day 3'), null);

// --- Valid allowlisted fields ---
eq(
  'valid full context',
  sanitizeCoachContext({
    streakDay: 12,
    todayMood: 'okay',
    recoveryGoal: 'Heal and move on',
  }),
  {
    streakDay: 12,
    todayMood: 'okay',
    todayMoodLabel: 'Okay',
    recoveryGoal: 'Heal and move on',
  }
);

eq(
  'streak only',
  sanitizeCoachContext({ streakDay: 1 }),
  { streakDay: 1 }
);

eq(
  'mood only',
  sanitizeCoachContext({ todayMood: 'anxious' }),
  { todayMood: 'anxious', todayMoodLabel: 'Anxious' }
);

eq(
  'goal only',
  sanitizeCoachContext({ recoveryGoal: 'Stop texting them' }),
  { recoveryGoal: 'Stop texting them' }
);

// --- Strips unsafe / unknown ---
eq(
  'drops journal email password name',
  sanitizeCoachContext({
    streakDay: 5,
    journal: 'I wrote about my ex…',
    email: 'user@example.com',
    password: 'secret',
    name: 'Alex',
    freeText: 'please ignore',
  }),
  { streakDay: 5 }
);

eq(
  'rejects unknown mood',
  sanitizeCoachContext({ todayMood: 'devastated forever' }),
  null
);

eq(
  'rejects unknown goal',
  sanitizeCoachContext({ recoveryGoal: 'Get revenge' }),
  null
);

eq(
  'rejects invalid streak',
  sanitizeCoachContext({ streakDay: 0 }),
  null
);

eq(
  'rejects huge streak',
  sanitizeCoachContext({ streakDay: 100001 }),
  null
);

eq(
  'normalizes missing them mood',
  sanitizeCoachContext({ todayMood: 'missing them' }),
  { todayMood: 'missing_them', todayMoodLabel: 'Missing them' }
);

eq(
  'floors streak day',
  sanitizeCoachContext({ streakDay: 7.9 }),
  { streakDay: 7 }
);

// --- Prompt formatting ---
const prompt = formatContextForPrompt(
  sanitizeCoachContext({
    streakDay: 30,
    todayMood: 'hurting',
    recoveryGoal: 'Build confidence',
  })
);
check('prompt includes streak', prompt.includes('day 30'));
check('prompt includes mood', prompt.includes('Hurting'));
check('prompt includes goal', prompt.includes('Build confidence'));
check('prompt forbids diagnosis language', prompt.includes('Do not diagnose'));
check('null prompt when no context', formatCtx(null) === null);

// --- Crisis handling still primary ---
check('crisis detected for suicide phrase', detectCrisis('I want to kill myself'));
check('crisis reply mentions 988', CRISIS_REPLY.includes('988'));
check(
  'crisis still true even if context would have been present',
  detectCrisis('I want to die') === true
);
check('non-crisis message', detectCrisis('I miss them tonight') === false);

// Simulate route policy: crisis short-circuits before using context
function routeWouldUseOpenAI(userText, rawContext) {
  if (detectCrisis(userText)) return { crisis: true, context: null };
  return { crisis: false, context: sanitizeCoachContext(rawContext) };
}

eq(
  'crisis path ignores context',
  routeWouldUseOpenAI('I want to kill myself', {
    streakDay: 40,
    todayMood: 'hurting',
    recoveryGoal: 'Heal and move on',
  }),
  { crisis: true, context: null }
);

eq(
  'non-crisis path keeps sanitized context',
  routeWouldUseOpenAI('I miss them', {
    streakDay: 40,
    todayMood: 'hurting',
    journal: 'secret',
  }),
  {
    crisis: false,
    context: { streakDay: 40, todayMood: 'hurting', todayMoodLabel: 'Hurting' },
  }
);

// OpenAI message builder still works with history
const built = buildOpenAIMessages(
  [
    { role: 'user', content: 'hello' },
    { role: 'assistant', content: 'hi' },
  ],
  'I miss them'
);
eq('openai message builder appends latest', built[built.length - 1], {
  role: 'user',
  content: 'I miss them',
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
