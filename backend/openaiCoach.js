const path = require('path');
const OpenAI = require('openai');
const { COACH_SYSTEM_PROMPT } = require('./coachPrompt');

let openaiClient = null;

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey });
  }

  return openaiClient;
}

function isOpenAIConfigured() {
  return Boolean(getOpenAIClient());
}

function sanitizeMessages(messages) {
  return messages
    .filter(
      (message) =>
        message &&
        (message.role === 'user' || message.role === 'assistant') &&
        typeof message.content === 'string' &&
        message.content.trim()
    )
    .slice(-12)
    .map((message) => ({
      role: message.role,
      content: message.content.trim().slice(0, 2000),
    }));
}

function buildOpenAIMessages(messages, latestUserText) {
  const trimmedLatest = String(latestUserText || '').trim();
  let sanitized = sanitizeMessages(messages);

  if (trimmedLatest) {
    const last = sanitized[sanitized.length - 1];

    if (!last || last.role !== 'user' || last.content !== trimmedLatest) {
      sanitized.push({ role: 'user', content: trimmedLatest });
    }
  }

  if (sanitized.length === 0 && trimmedLatest) {
    sanitized = [{ role: 'user', content: trimmedLatest }];
  }

  return sanitized;
}

/**
 * Calls OpenAI for a coach reply. Throws if the API fails or key is missing.
 */
async function generateOpenAIReply(messages, latestUserText) {
  const openai = getOpenAIClient();

  if (!openai) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const sanitized = buildOpenAIMessages(messages, latestUserText);

  if (sanitized.length === 0) {
    throw new Error('No valid messages to send to OpenAI');
  }

  const openaiMessages = [
    { role: 'system', content: COACH_SYSTEM_PROMPT },
    ...sanitized,
  ];

  console.log(
    '[AI Coach] message sent to OpenAI (latest user turn):',
    sanitized[sanitized.length - 1]?.content
  );

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: openaiMessages,
    max_tokens: 180,
    temperature: 0.78,
  });

  const reply = completion.choices[0]?.message?.content?.trim();

  if (!reply) {
    throw new Error('OpenAI returned an empty reply');
  }

  return reply;
}

module.exports = {
  generateOpenAIReply,
  isOpenAIConfigured,
  sanitizeMessages,
  buildOpenAIMessages,
};
