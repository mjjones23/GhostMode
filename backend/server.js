const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
console.log('OpenAI key detected:', !!process.env.OPENAI_API_KEY);

const express = require('express');
const cors = require('cors');
const chatRoutes = require('./routes/chat');
const { isOpenAIConfigured } = require('./openaiCoach');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '32kb' }));

app.get('/health', (_req, res) => {
  const openaiConfigured = isOpenAIConfigured();

  res.json({
    ok: true,
    mode: openaiConfigured ? 'openai' : 'mock',
    openaiConfigured,
  });
});

app.use(chatRoutes);

app.listen(PORT, '0.0.0.0', () => {
  const openaiConfigured = isOpenAIConfigured();

  console.log(`Ghost Mode backend running on http://localhost:${PORT}`);
  console.log(`Health: GET http://localhost:${PORT}/health`);
  console.log(`Chat:   POST http://localhost:${PORT}/chat`);

  if (openaiConfigured) {
    console.log('OpenAI connected — real AI replies when the API succeeds.');
    console.log('Mock replies used if OpenAI fails or key is missing.');
  } else {
    console.warn(
      'OPENAI_API_KEY not set — mock replies only. Add key to backend/.env for real AI.'
    );
  }
});
