import { detectCrisis, CRISIS_REPLY } from '../utils/crisisSafety';
import { getMockReply } from '../utils/mockCoach';
import { getCoachApiUrl, isCoachApiConfigured } from '../config/api';

const REQUEST_TIMEOUT_MS = 12000;
const HEALTH_TIMEOUT_MS = 5000;
const STATIC_WELCOME_IDS = new Set(['welcome', 'starter']);

const OFFLINE_USER_MESSAGE =
  "Couldn't reach Ghost Mode AI. Check your connection or try again later.";
const NOT_CONFIGURED_MESSAGE =
  'Coach backend URL is not configured for this build.';

function buildApiMessages(chatHistory) {
  const mapped = chatHistory
    .filter(
      (message) =>
        (message.sender === 'user' || message.sender === 'ai') &&
        !STATIC_WELCOME_IDS.has(message.id)
    )
    .map((message) => ({
      role: message.sender === 'user' ? 'user' : 'assistant',
      content: String(message.text || '').trim(),
    }))
    .filter((message) => message.content);

  return mapped.slice(-12);
}

function getLatestUserText(chatHistory) {
  for (let index = chatHistory.length - 1; index >= 0; index -= 1) {
    const message = chatHistory[index];
    if (message.sender === 'user') {
      return String(message.text || '').trim();
    }
  }
  return '';
}

async function postChat(messages, userMessage) {
  const baseUrl = getCoachApiUrl();
  if (!baseUrl) {
    return {
      ok: false,
      status: 0,
      data: {},
      error: NOT_CONFIGURED_MESSAGE,
    };
  }

  const requestBody = { messages, userMessage };
  console.log('[AI Coach] request body sent to backend:', JSON.stringify(requestBody));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    const aborted = error?.name === 'AbortError';
    return {
      ok: false,
      status: 0,
      data: {},
      error: aborted
        ? 'Ghost Mode AI took too long to respond.'
        : OFFLINE_USER_MESSAGE,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Checks whether the Ghost Mode backend is reachable.
 * Health returns mode: openai | mock depending on OPENAI_API_KEY on the server.
 * Never returns or logs API keys.
 */
export async function checkBackendStatus() {
  if (!isCoachApiConfigured()) {
    return {
      connected: false,
      mode: 'offline',
      openaiConfigured: false,
      error: NOT_CONFIGURED_MESSAGE,
    };
  }

  const baseUrl = getCoachApiUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/health`, {
      signal: controller.signal,
    });

    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    const connected = Boolean(response.ok && data.ok);

    return {
      connected,
      mode: connected ? data.mode || 'mock' : 'offline',
      openaiConfigured: Boolean(data.openaiConfigured),
      error: connected ? null : OFFLINE_USER_MESSAGE,
    };
  } catch (error) {
    const aborted = error?.name === 'AbortError';
    return {
      connected: false,
      mode: 'offline',
      openaiConfigured: false,
      error: aborted
        ? 'Ghost Mode AI health check timed out.'
        : OFFLINE_USER_MESSAGE,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

function fallbackReply(userText) {
  try {
    return getMockReply(userText);
  } catch {
    return "I'm here with you. Take a slow breath — you don't have to text them tonight.";
  }
}

/**
 * Gets a coach reply: tries POST /chat on the backend first,
 * then falls back to in-app mock replies. Never throws.
 * Never sends or exposes OpenAI API keys from the mobile app.
 */
export async function fetchCoachReply({ userText, chatHistory = [] }) {
  const trimmedFromArg = String(userText || '').trim();
  const trimmedFromHistory = getLatestUserText(chatHistory);
  const trimmed = trimmedFromArg || trimmedFromHistory;

  if (!trimmed) {
    return {
      reply: fallbackReply(''),
      crisis: false,
      source: 'mock',
      mode: 'mock',
    };
  }

  if (detectCrisis(trimmed)) {
    return {
      reply: CRISIS_REPLY,
      crisis: true,
      source: 'local',
      mode: 'mock',
    };
  }

  if (!isCoachApiConfigured()) {
    return {
      reply: fallbackReply(trimmed),
      crisis: false,
      source: 'mock',
      mode: 'mock',
      error: NOT_CONFIGURED_MESSAGE,
    };
  }

  const messages = buildApiMessages(chatHistory);

  try {
    const { ok, data, error } = await postChat(messages, trimmed);

    if (ok && typeof data.reply === 'string' && data.reply.trim()) {
      return {
        reply: data.reply.trim(),
        crisis: Boolean(data.crisis),
        source: data.source === 'backend' ? 'backend' : 'server',
        mode: data.mode || 'mock',
      };
    }

    return {
      reply: fallbackReply(trimmed),
      crisis: false,
      source: 'mock',
      mode: 'mock',
      error: error || OFFLINE_USER_MESSAGE,
    };
  } catch {
    // Backend offline or unreachable — use in-app mock below.
  }

  return {
    reply: fallbackReply(trimmed),
    crisis: false,
    source: 'mock',
    mode: 'mock',
    error: OFFLINE_USER_MESSAGE,
  };
}
