/**
 * Optional AI ranking for daily recovery plans.
 * Always returns activity IDs from the allowed catalog — never invents tasks.
 * On any failure, callers must use the local rule-based builder.
 */

const { isOpenAIConfigured, getOpenAIClient } = require('./openaiCoach');

const SAFETY_PREAMBLE = `You help build supportive, non-clinical daily recovery checklists for people practicing no-contact after a breakup.
Rules:
- Do NOT diagnose, treat, or claim medical/therapeutic authority.
- Do NOT suggest contacting the ex, stalking, or substance use.
- Choose ONLY from the provided activity id list.
- Return JSON only: {"activityIds":["id1","id2",...]} with 3 to 5 ids.`;

function uniqueValidIds(ids, allowed) {
  const out = [];
  const seen = new Set();
  for (const raw of ids || []) {
    const id = String(raw || '').trim();
    if (!id || seen.has(id) || !allowed.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= 5) break;
  }
  return out;
}

/**
 * @param {object} input
 * @param {string[]} input.candidateIds - catalog ids already filtered for stage
 * @param {object} input.context - streakDay, mood, goal, stage (no journal text)
 * @returns {Promise<{ ok: boolean, activityIds?: string[], source: string }>}
 */
async function rankDailyPlanActivities(input) {
  const candidateIds = Array.isArray(input?.candidateIds)
    ? input.candidateIds.map((id) => String(id).trim()).filter(Boolean)
    : [];
  const allowed = new Set(candidateIds);

  if (candidateIds.length < 3) {
    return { ok: false, source: 'insufficient_candidates' };
  }

  if (!isOpenAIConfigured()) {
    return { ok: false, source: 'openai_not_configured' };
  }

  const context = input?.context && typeof input.context === 'object' ? input.context : {};
  const safeContext = {
    streakDay: Number(context.streakDay) || 1,
    mood: context.mood ? String(context.mood).slice(0, 40) : null,
    goal: context.goal ? String(context.goal).slice(0, 80) : null,
    stage: context.stage ? String(context.stage).slice(0, 40) : null,
  };

  try {
    const client = getOpenAIClient();
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.4,
      max_tokens: 200,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SAFETY_PREAMBLE },
        {
          role: 'user',
          content: JSON.stringify({
            context: safeContext,
            candidateIds,
            instruction: 'Pick 3-5 activity ids tailored to context.',
          }),
        },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content || '';
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { ok: false, source: 'invalid_json' };
    }

    const activityIds = uniqueValidIds(parsed?.activityIds, allowed);
    if (activityIds.length < 3) {
      return { ok: false, source: 'invalid_ids' };
    }

    return { ok: true, activityIds, source: 'openai' };
  } catch {
    return { ok: false, source: 'openai_error' };
  }
}

module.exports = {
  rankDailyPlanActivities,
  uniqueValidIds,
};
