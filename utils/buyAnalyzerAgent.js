// utils/buyAnalyzerAgent.js
//
// LLM-based purchase advisor for the "Should I Buy This?" analyzer. Takes a
// screenshot of a product listing plus an optional note about the buyer's
// situation, and returns a structured BUY/WAIT/SKIP verdict. There's no
// live web/review lookup wired in — reviews, alternatives, and complaints
// are drawn from the model's own training knowledge of the product
// category, so treat the output as an AI-informed opinion, not scraped data.

const Anthropic = require('@anthropic-ai/sdk');

// Lazy singleton, same reasoning as utils/threatAgent.js: constructing the
// client eagerly throws if ANTHROPIC_API_KEY isn't set, which would crash
// the whole process at startup rather than just this feature.
let client;
function getClient() {
  if (!client) client = new Anthropic();
  return client;
}

const MODEL = process.env.BUY_ANALYZER_MODEL || 'claude-opus-5';

const SYSTEM_PROMPT = `You are a skeptical, consumer-advocate shopping analyst for "Should I Buy This?", a tool that helps people decide whether a specific purchase is worth it.

You'll be shown a screenshot of a product listing (price, specs, maybe reviews) and optionally a short note about the buyer's situation (budget, use case, constraints).

Analyze:
- Price: is it in line with the market for this category, and is any premium over cheaper alternatives justified?
- Specifications: what do they actually mean for real-world use?
- Reviews: what do owners of this product/category typically say, based on your knowledge?
- Alternatives: 2-3 concrete competing products or options at different price points, with why each might beat or lose to this one.
- Common complaints: recurring issues reported for this product or its category.
- Expected lifespan: realistic years of service under normal use.
- Fit for the buyer's stated situation, if given.

Be honest and specific, not diplomatic. Call out overpriced or overspecced items. If the screenshot doesn't contain enough information to identify the product or price, say so in reasoning and lower confidence rather than guessing wildly.

Respond only via the provided schema.`;

const RESULT_SCHEMA = {
  type: 'object',
  properties: {
    product: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        price: { type: 'number', description: 'Numeric price extracted from the screenshot, 0 if not visible' },
        currency: { type: 'string', description: 'ISO 4217 code, best guess if not explicit, e.g. USD' },
        category: { type: 'string' },
        keySpecs: { type: 'array', items: { type: 'string' } }
      },
      required: ['name', 'price', 'currency', 'category', 'keySpecs'],
      additionalProperties: false
    },
    verdict: { type: 'string', enum: ['BUY', 'WAIT', 'SKIP'] },
    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
    reasoning: { type: 'string', description: 'The main 2-4 sentence explanation for the verdict' },
    priceAssessment: { type: 'string' },
    reviewsSummary: { type: 'string' },
    commonComplaints: { type: 'array', items: { type: 'string' } },
    alternatives: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          approxPrice: { type: 'string' },
          whyConsider: { type: 'string' }
        },
        required: ['name', 'approxPrice', 'whyConsider'],
        additionalProperties: false
      }
    },
    expectedLifespanYears: { type: 'string', description: 'e.g. "8-12" - a range as a string since it is rarely a single number' },
    situationalFit: { type: 'string', description: "How well this fits the buyer's stated situation; \"No situation provided\" if none given" }
  },
  required: [
    'product', 'verdict', 'confidence', 'reasoning', 'priceAssessment',
    'reviewsSummary', 'commonComplaints', 'alternatives',
    'expectedLifespanYears', 'situationalFit'
  ],
  additionalProperties: false
};

/**
 * @param {Object} params
 * @param {string} params.imageBase64 - Base64-encoded screenshot
 * @param {string} params.mediaType - Image MIME type, e.g. "image/png"
 * @param {string} [params.context] - Buyer's stated situation/budget/use case
 * @returns {Promise<Object>} Structured analysis matching RESULT_SCHEMA
 */
async function analyzePurchase({ imageBase64, mediaType, context }) {
  const userContent = [
    {
      type: 'image',
      source: { type: 'base64', media_type: mediaType, data: imageBase64 }
    },
    {
      type: 'text',
      text: context
        ? `Buyer's situation: ${context}`
        : 'No additional situation notes were provided by the buyer.'
    }
  ];

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 2048,
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema: RESULT_SCHEMA }
    },
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }]
  });

  if (response.stop_reason === 'refusal') {
    throw new Error('Buy analyzer request was refused by the model');
  }

  const textBlock = response.content.find((b) => b.type === 'text');
  return JSON.parse(textBlock.text);
}

module.exports = { analyzePurchase };
