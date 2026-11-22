const express = require('express');
const { detectCrisis, CRISIS_REPLY } = require('../crisisSafety');

const router = express.Router();

function sttConfigured() {
  return Boolean(String(process.env.VOICE_STT_API_KEY || '').trim());
}

function ttsConfigured() {
  return Boolean(String(process.env.VOICE_TTS_API_KEY || '').trim());
}

/**
 * POST /voice/transcribe
 * Accepts multipart audio when STT is configured.
 * Without keys, returns 503 so the client can fall back safely.
 */
router.post('/voice/transcribe', async (req, res) => {
  if (!sttConfigured()) {
    return res.status(503).json({
      error: 'stt_not_configured',
      message:
        'Speech-to-text is not configured. Add VOICE_STT_API_KEY on the server after provider review.',
      provider: null,
    });
  }

  // Provider wiring intentionally deferred until vendor review.
  // Keeping the route + auth/privacy envelope ready.
  return res.status(501).json({
    error: 'stt_not_implemented',
    message:
      'STT provider adapter is prepared but not activated. Keys stay server-side only.',
  });
});

/**
 * POST /voice/speak
 * { text } → audioUrl when TTS is configured.
 */
router.post('/voice/speak', async (req, res) => {
  const text = String(req.body?.text || '').trim().slice(0, 500);
  if (!text) {
    return res.status(400).json({ error: 'text is required' });
  }

  if (detectCrisis(text)) {
    return res.json({
      crisis: true,
      transcriptSafety: CRISIS_REPLY,
      audioUrl: null,
      provider: 'crisis',
    });
  }

  if (!ttsConfigured()) {
    return res.status(503).json({
      error: 'tts_not_configured',
      message:
        'Text-to-speech is not configured. Add VOICE_TTS_API_KEY on the server after provider review.',
    });
  }

  return res.status(501).json({
    error: 'tts_not_implemented',
    message:
      'TTS provider adapter is prepared but not activated. Keys stay server-side only.',
  });
});

router.get('/voice/status', (_req, res) => {
  res.json({
    ok: true,
    sttConfigured: sttConfigured(),
    ttsConfigured: ttsConfigured(),
    maxSeconds: Number.parseInt(process.env.VOICE_MAX_SECONDS || '45', 10) || 45,
  });
});

module.exports = router;
