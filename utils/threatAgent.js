// utils/threatAgent.js
//
// LLM-based threat triage. Same job as threatScorer.js (score + tags per
// RSS item) but using judgment instead of keyword matching, so it can tell
// "military discount" from an actual military threat.

const Anthropic = require('@anthropic-ai/sdk');

// Lazy singleton: the SDK throws at construction time if it can't resolve
// credentials, so building it eagerly at module load would crash the whole
// server on startup whenever ANTHROPIC_API_KEY isn't set — even though this
// agent is only ever used on an opt-in ?compareAI=true request.
let client;
function getClient() {
  if (!client) client = new Anthropic();
  return client;
}

const MODEL = process.env.THREAT_AGENT_MODEL || 'claude-opus-5';
const BATCH_SIZE = 20; // items per API call — keeps requests small and cacheable

const SYSTEM_PROMPT = `You are a threat intelligence triage analyst for ThreatPulse, a security news monitoring tool.

For each numbered news item, assess whether it describes a genuine physical, cyber, or civil-safety threat — not just an article that happens to contain threat-adjacent words. Score 0-100 for severity, where 100 is an imminent, large-scale, verified threat and 0 is no real threat content at all (false-positive keyword matches, unrelated usage of a word like "attack" in a sports headline, etc).

Guidelines:
- Distinguish real threats from incidental language ("attack" in "attack on titan", "military" in "military discount").
- Consider scale, verification status, and immediacy, not just presence of alarming words.
- tags should be short lowercase categories (e.g. "cyber", "military", "civil unrest", "natural disaster", "false positive").
- rationale is one short sentence explaining the score.

Respond only via the provided schema, one result per input item, preserving the input index.`;

const RESULT_SCHEMA = {
  type: 'object',
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          index: { type: 'integer', description: 'Matches the input item number' },
          score: { type: 'integer', description: '0-100 threat severity' },
          level: { type: 'string', enum: ['low', 'medium', 'high'] },
          tags: { type: 'array', items: { type: 'string' } },
          rationale: { type: 'string' }
        },
        required: ['index', 'score', 'level', 'tags', 'rationale'],
        additionalProperties: false
      }
    }
  },
  required: ['results'],
  additionalProperties: false
};

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function scoreBatch(items) {
  const numbered = items
    .map((item, i) => `[${i}] ${item.title || ''}\n${item.contentSnippet || ''}`)
    .join('\n\n');

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 4096,
    thinking: { type: 'disabled' }, // per-item triage doesn't need deep reasoning
    output_config: {
      effort: 'low',
      format: { type: 'json_schema', schema: RESULT_SCHEMA }
    },
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: numbered }]
  });

  if (response.stop_reason === 'refusal') {
    throw new Error('Threat agent request was refused by the model');
  }

  const textBlock = response.content.find((b) => b.type === 'text');
  const parsed = JSON.parse(textBlock.text);

  return parsed.results.map((r) => ({
    ...items[r.index],
    aiScore: r.score,
    aiLevel: r.level,
    aiTags: r.tags,
    aiRationale: r.rationale
  }));
}

/**
 * Scores RSS items with the LLM triage agent, in place of (or alongside)
 * the keyword-based scoreThreat/extractTags in threatScorer.js.
 *
 * @param {Array<{title: string, contentSnippet?: string}>} items
 * @returns {Promise<Array>} items annotated with aiScore/aiLevel/aiTags/aiRationale
 */
async function scoreThreatsWithAI(items) {
  if (!items.length) return [];

  const batches = chunk(items, BATCH_SIZE);
  const results = [];
  for (const batch of batches) {
    // Sequential to stay easy on rate limits; batches are independent so this
    // could be Promise.all'd later if throughput becomes a bottleneck.
    results.push(...(await scoreBatch(batch)));
  }
  return results;
}

module.exports = { scoreThreatsWithAI };
