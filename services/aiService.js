import { detectCrisis, CRISIS_REPLY } from '../utils/crisisSafety';
import { getMockReply } from '../utils/mockCoach';

/**
 * Backend on your PC (same Wi‑Fi as your iPhone).
 * localhost only works in the simulator — Expo Go on a real phone needs this IP.
 * Override with EXPO_PUBLIC_COACH_API_URL in .env if your PC IP changes.
 */
const BACKEND_URL = (
  process.env.EXPO_PUBLIC_COACH_API_URL || 'http://10.0.0.200:3001'
).replace(/\/$/, '');

const REQUEST_TIMEOUT_MS = 12000;
const HEALTH_TIMEOUT_MS = 5000;
const STATIC_WELCOME_IDS = new Set(['welcome', 'starter']);

function getBackendUrl() {
  return BACKEND_URL;
}

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
  const requestBody = { messages, userMessage };
  console.log('[AI Coach] request body sent to backend:', JSON.stringify(requestBody));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${getBackendUrl()}/chat`, {
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
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Checks whether the Ghost Mode backend is reachable.
 * Health returns mode: openai | mock depending on OPENAI_API_KEY on the server.
 */
export async function checkBackendStatus() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

  try {
    const response = await fetch(`${getBackendUrl()}/health`, {
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
    };
  } catch {
    return {
      connected: false,
      mode: 'offline',
      openaiConfigured: false,
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

  const messages = buildApiMessages(chatHistory);

  try {
    const { ok, data } = await postChat(messages, trimmed);

    if (ok && typeof data.reply === 'string' && data.reply.trim()) {
      return {
        reply: data.reply.trim(),
        crisis: Boolean(data.crisis),
        source: data.source === 'backend' ? 'backend' : 'server',
        mode: data.mode || 'mock',
      };
    }
  } catch {
    // Backend offline or unreachable — use in-app mock below.
  }

  return {
    reply: fallbackReply(trimmed),
    crisis: false,
    source: 'mock',
    mode: 'mock',
  };
}
