/**
 * Proves AI Coach logs omit message, memory, journal, and provider error text.
 * Does not call OpenAI or Railway.
 * Run: node backend/test-coach-logs.js
 */
delete process.env.OPENAI_API_KEY;
process.env.OPENAI_BASE_URL = 'http://127.0.0.1:9';

const PRIVATE = 'qx91-private-note';
const MEMORY = 'qx91-memory-note';
const JOURNAL = 'qx91-journal-note';
const PROVIDER = 'qx91-provider-echo';
const AI_REPLY = 'qx91-ai-reply';

let passed = 0;
let failed = 0;
const realLog = console.log.bind(console);
const realError = console.error.bind(console);

function check(name, condition, detail) {
  if (condition) {
    passed += 1;
    realLog(`PASS  ${name}`);
  } else {
    failed += 1;
    realLog(
      `FAIL  ${name}${detail !== undefined ? ` → ${JSON.stringify(detail)}` : ''}`
    );
  }
}

function serialize(args) {
  return args
    .map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg)))
    .join(' ');
}

function capture() {
  const lines = [];
  console.log = (...args) => {
    lines.push(serialize(args));
  };
  console.error = (...args) => {
    lines.push(serialize(args));
  };
  return lines;
}

function restoreConsole() {
  console.log = realLog;
  console.error = realError;
}

function hidden(lines) {
  const joined = lines.join('\n');
  return [PRIVATE, MEMORY, JOURNAL, PROVIDER, AI_REPLY].every(
    (token) => !joined.includes(token)
  );
}

function installOpenAIStub(create) {
  const openaiPath = require.resolve('openai');
  require.cache[openaiPath] = {
    id: openaiPath,
    filename: openaiPath,
    loaded: true,
    exports: class FakeOpenAI {
      constructor() {
        this.chat = { completions: { create } };
      }
    },
  };
  delete require.cache[require.resolve('./openaiCoach')];
  delete require.cache[require.resolve('./routes/chat')];
}

function invokeRouter(body) {
  const router = require('./routes/chat');
  return new Promise((resolve, reject) => {
    const req = { method: 'POST', url: '/chat', originalUrl: '/chat', body, headers: {} };
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        resolve({ status: this.statusCode, body: payload });
      },
    };
    router(req, res, (error) => {
      if (error) reject(error);
    });
  });
}

function coachBody(text, extra = {}) {
  return {
    messages: [
      { role: 'assistant', content: `earlier ${PRIVATE}` },
      { role: 'user', content: text },
    ],
    userMessage: text,
    context: {
      streakDay: 4,
      recoveryGoal: 'Heal and move on',
      journal: JOURNAL,
    },
    memories: [{ text: MEMORY }, { text: `password ${PRIVATE}` }],
    ...extra,
  };
}

async function main() {
  delete require.cache[require.resolve('./routes/chat')];
  delete require.cache[require.resolve('./openaiCoach')];

  let lines = capture();
  let result = await invokeRouter(coachBody(`I want to kill myself ${PRIVATE}`));
  restoreConsole();
  check('crisis response stays on the safety path', result.body.crisis === true);
  check('crisis logs omit private text', hidden(lines));
  check(
    'crisis log keeps length and flag',
    lines.some((line) => line.includes('"crisis":true') && line.includes('"chars":'))
  );

  lines = capture();
  result = await invokeRouter(coachBody(`I miss them ${PRIVATE}`));
  restoreConsole();
  check('missing key still returns a reply', typeof result.body.reply === 'string' && result.body.reply.length > 0);
  check('missing key does not call OpenAI', result.body.mode === 'mock');
  check('missing-key logs omit private text', hidden(lines));
  check(
    'missing-key log names the fallback',
    lines.some((line) => line.includes('openai not configured'))
  );

  let createCalls = 0;
  installOpenAIStub(async () => {
    createCalls += 1;
    const error = new Error(`${PROVIDER} ${PRIVATE} ${JOURNAL}`);
    error.status = 429;
    throw error;
  });
  process.env.OPENAI_API_KEY = 'test-key-not-sent';

  lines = capture();
  result = await invokeRouter(coachBody(`I miss them ${PRIVATE}`));
  restoreConsole();
  check('provider failure still returns a fallback reply', result.body.mode === 'mock');
  check('provider failure reached the stub', createCalls === 1);
  check('provider-error logs omit private and raw error text', hidden(lines));
  check(
    'provider-error log keeps a status category',
    lines.some((line) => line.includes('status 429'))
  );

  installOpenAIStub(async () => {
    createCalls += 1;
    return { choices: [{ message: { content: `${AI_REPLY} stay` } }] };
  });

  lines = capture();
  result = await invokeRouter(coachBody(`I miss them ${PRIVATE}`));
  restoreConsole();
  check('successful reply is returned to the app', result.body.reply === `${AI_REPLY} stay`);
  check('successful reply text is not logged', hidden(lines));
  check(
    'successful request logs length only',
    lines.some((line) => line.includes('"latestUserChars":') && line.includes('"messageCount":'))
  );

  delete process.env.OPENAI_API_KEY;
  delete require.cache[require.resolve('./routes/chat')];
  delete require.cache[require.resolve('./openaiCoach')];

  const memories = [{ text: MEMORY }];
  memories[Symbol.iterator] = () => {
    throw new Error(`${PRIVATE} ${PROVIDER} handler exploded`);
  };

  lines = capture();
  result = await invokeRouter(coachBody(`I miss them ${PRIVATE}`, { memories }));
  restoreConsole();
  check('handler error still returns a reply', typeof result.body.reply === 'string');
  check('handler-error logs omit private text', hidden(lines));
  check(
    'handler-error log keeps a safe category',
    lines.some((line) => line.includes('handler error'))
  );

  realLog(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((error) => {
  restoreConsole();
  realError(error);
  process.exit(1);
});
