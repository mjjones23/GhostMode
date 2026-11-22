const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
console.log('OpenAI key detected:', !!process.env.OPENAI_API_KEY);

const express = require('express');
const cors = require('cors');
const chatRoutes = require('./routes/chat');
const quotaRoutes = require('./routes/quota');
const dailyPlanRoutes = require('./routes/dailyPlan');
const entitlementRoutes = require('./routes/entitlements');
const voiceRoutes = require('./routes/voice');
const accountRoutes = require('./routes/account');
const { isOpenAIConfigured } = require('./openaiCoach');
const { QUOTA_ENFORCEMENT, FREE_LIMIT, WINDOW_MS } = require('./quotaConfig');
const { PRO_LIMIT } = require('./quotaGuard');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '64kb' }));

app.get('/health', (_req, res) => {
  const openaiConfigured = isOpenAIConfigured();

  res.json({
    ok: true,
    mode: openaiConfigured ? 'openai' : 'mock',
    openaiConfigured,
    quotaEnforcement: QUOTA_ENFORCEMENT,
    freeAiLimit: FREE_LIMIT,
    proAiLimit: PRO_LIMIT,
    freeAiWindowMs: WINDOW_MS,
    voiceSttConfigured: Boolean(process.env.VOICE_STT_API_KEY),
    voiceTtsConfigured: Boolean(process.env.VOICE_TTS_API_KEY),
    cloudSyncEnabled: ['1', 'true', 'yes', 'on'].includes(
      String(process.env.CLOUD_SYNC_ENABLED || '').toLowerCase()
    ),
  });
});

app.use(chatRoutes);
app.use(quotaRoutes);
app.use(dailyPlanRoutes);
app.use(entitlementRoutes);
app.use(voiceRoutes);
app.use(accountRoutes);

app.listen(PORT, '0.0.0.0', () => {
  const openaiConfigured = isOpenAIConfigured();

  console.log(`Ghost Mode backend running on http://localhost:${PORT}`);
  console.log(`Health: GET http://localhost:${PORT}/health`);
  console.log(`Chat:   POST http://localhost:${PORT}/chat`);
  console.log(`Quota:  GET  http://localhost:${PORT}/quota`);
  console.log(`Plans:  POST http://localhost:${PORT}/daily-plan/rank`);
  console.log(`Voice:  POST http://localhost:${PORT}/voice/transcribe|speak`);
  console.log(`Entitlements: GET http://localhost:${PORT}/entitlements`);
  console.log(
    `AI quota enforcement: ${QUOTA_ENFORCEMENT ? 'on' : 'off'} (free ${FREE_LIMIT} / pro ${PRO_LIMIT} per ${WINDOW_MS}ms)`
  );

  if (openaiConfigured) {
    console.log('OpenAI connected — real AI replies when the API succeeds.');
    console.log('Mock replies used if OpenAI fails or key is missing.');
  } else {
    console.warn(
      'OPENAI_API_KEY not set — mock replies only. Add key to backend/.env for real AI.'
    );
  }
});
