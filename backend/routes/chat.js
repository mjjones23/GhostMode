const express = require('express');
const { detectCrisis, CRISIS_REPLY } = require('../crisisSafety');
const { getMockReply } = require('../mockCoach');
const { generateOpenAIReply, isOpenAIConfigured } = require('../openaiCoach');
const { sanitizeCoachContext } = require('../coachContext');
const { memoriesAllowedForPrompt } = require('../coachMemory');

const router = express.Router();

function crisisResponse() {
  return {
    reply: CRISIS_REPLY,
    crisis: true,
    source: 'backend',
    mode: 'mock',
  };
}

function mockResponse(userText, reason) {
  console.log('[AI Coach] mock fallback used: yes —', reason);

  return {
    reply: getMockReply(userText),
    crisis: false,
    source: 'backend',
    mode: 'mock',
  };
}

router.post('/chat', async (req, res) => {
  try {
    const {
      messages,
      userMessage: userMessageField,
      context: rawContext,
      memories: rawMemories,
    } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const lastUser = [...messages].reverse().find((message) => message.role === 'user');

    if (!lastUser || typeof lastUser.content !== 'string') {
      return res.status(400).json({ error: 'last user message is required' });
    }

    const userText = String(userMessageField || lastUser.content).trim();
    const personalizationContext = sanitizeCoachContext(rawContext);

    console.log('[AI Coach] message received by backend:', userText);
    console.log(
      '[AI Coach] personalization context:',
      personalizationContext ? 'present (sanitized)' : 'none'
    );

    if (!userText) {
      return res.status(400).json({ error: 'user message is required' });
    }

    // Crisis always wins — context and saved memories are not sent to the model.
    if (detectCrisis(userText)) {
      console.log('[AI Coach] saved memories: ignored for crisis');
      return res.json(crisisResponse());
    }

    const savedMemories = memoriesAllowedForPrompt(
      userText,
      rawMemories,
      detectCrisis
    );
    console.log(
      '[AI Coach] saved memories:',
      savedMemories ? savedMemories.length : 0
    );

    if (isOpenAIConfigured()) {
      console.log('[AI Coach] OpenAI called: attempting');

      try {
        const reply = await generateOpenAIReply(
          messages,
          userText,
          personalizationContext,
          savedMemories
        );

        if (detectCrisis(reply)) {
          return res.json(crisisResponse());
        }

        console.log('[AI Coach] OpenAI called: yes');
        console.log('[AI Coach] mock fallback used: no');

        return res.json({
          reply,
          crisis: false,
          source: 'backend',
          mode: 'openai',
          contextUsed: Boolean(personalizationContext),
        });
      } catch (error) {
        console.log('[AI Coach] OpenAI called: yes (failed)');
        console.error('[AI Coach] OpenAI error:', error.message);
        return res.json(mockResponse(userText, error.message));
      }
    }

    console.log('[AI Coach] OpenAI called: no (key missing)');
    return res.json(mockResponse(userText, 'OPENAI_API_KEY not configured'));
  } catch (error) {
    console.error('POST /chat error:', error.message);

    try {
      const lastUser = [...(req.body?.messages || [])]
        .reverse()
        .find((message) => message.role === 'user');
      const userText = String(req.body?.userMessage || lastUser?.content || '').trim();

      console.log('[AI Coach] OpenAI called: no (handler error)');
      return res.json(mockResponse(userText, error.message));
    } catch {
      return res.status(500).json({
        error: 'Could not generate a coach reply. Try again in a moment.',
      });
    }
  }
});

module.exports = router;
