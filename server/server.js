require('dotenv').config();

const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const { detectCrisis, CRISIS_REPLY } = require('./crisisSafety');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '32kb' }));

/** OpenAI key lives ONLY here in server/.env — never in the mobile app. */
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const SYSTEM_PROMPT = `You are Ghost Mode AI Coach — a supportive breakup recovery coach for people doing no-contact after a breakup.

Your role:
- Be calm, warm, emotionally intelligent, and non-judgmental.
- Help with missing an ex, urges to text them, loneliness, anger, and healing after a breakup.
- Keep replies SHORT: 1–3 sentences, under 60 words when possible.
- Sound like a wise, steady friend — not cheesy, not preachy.

Important limits:
- You are NOT a therapist, doctor, psychiatrist, or crisis counselor. Never claim to be one.
- Do not diagnose mental health conditions or give medical or legal advice.
- Never encourage contacting an ex if it would harm their healing.
- If someone mentions self-harm, suicide, or wanting to die, you must NOT try to coach them through it. Tell them Ghost Mode is not crisis support and urge them to contact emergency services or a crisis hotline immediately.`;

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    openaiConfigured: Boolean(openai),
  });
});

async function handleCoachChat(req, res) {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const lastUser = [...messages].reverse().find((message) => message.role === 'user');

    if (lastUser && detectCrisis(lastUser.content)) {
      return res.json({ reply: CRISIS_REPLY, crisis: true });
    }

    if (!openai) {
      return res.status(503).json({
        error:
          'Server missing OPENAI_API_KEY. Copy server/.env.example to server/.env and add your key.',
      });
    }

    const sanitized = messages
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

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...sanitized],
      max_tokens: 120,
      temperature: 0.7,
    });

    const reply =
      completion.choices[0]?.message?.content?.trim() ||
      "I'm here with you. Take a breath — what's weighing on you most right now?";

    if (detectCrisis(reply)) {
      return res.json({ reply: CRISIS_REPLY, crisis: true });
    }

    res.json({ reply, crisis: false });
  } catch (error) {
    console.error('Coach API error:', error.message);
    res.status(500).json({
      error: 'Could not get a response from AI Coach. Try again in a moment.',
    });
  }
}

app.post('/chat', handleCoachChat);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Ghost Mode coach server running on http://localhost:${PORT}`);
  console.log(`AI chat endpoint: POST http://localhost:${PORT}/chat`);
  if (!openai) {
    console.warn('WARNING: OPENAI_API_KEY is missing. Copy server/.env.example to server/.env');
  }
});
