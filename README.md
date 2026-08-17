# ThreatPulse Backend

Express API that aggregates RSS feeds — mainstream news, cybersecurity specialist outlets, defense/geopolitical analysis, and disaster/crisis alerts (see the categorized list in `utils/rssParser.js`) — scores/filters them by keyword and risk level, and optionally re-scores them with an LLM-based triage agent. Paired with [threatpulse-frontend](https://github.com/graydragon2/threatpulse-frontend).

Also hosts a "Should I Buy This?" purchase analyzer (`/buy-analyzer`) — an unrelated, self-contained feature sharing this server's Express/Anthropic setup.

## Setup

```bash
npm install
cp .env.example .env   # fill in ANTHROPIC_API_KEY if you want AI-assisted triage
npm start
```

Runs on `PORT` (defaults to `8080`).

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | No | Server port (default `8080`) |
| `ANTHROPIC_API_KEY` | Only for `?compareAI=true` and `/buy-analyzer` | Powers `utils/threatAgent.js`'s LLM threat triage and `utils/buyAnalyzerAgent.js`'s purchase analysis. Everything else works without it. |
| `THREAT_AGENT_MODEL` | No | Overrides the default Claude model used for triage |
| `BUY_ANALYZER_MODEL` | No | Overrides the default Claude model used for the buy analyzer |

## API

- `GET /rss` — aggregated, filtered threat feed.
  Query params: `keywords` (comma-separated), `sources` (repeatable), `startDate`, `endDate`, `riskLevel`, `tags` (comma-separated), `compareAI` (`true` to also attach LLM-scored `aiScore`/`aiLevel`/`aiTags`/`aiRationale` alongside the keyword-based score).
- `GET /export/csv`, `GET /export/pdf` — export the current feed.
- `GET /history` — previously generated report metadata.
- `GET /downloads/*` — static download of previously generated export files (`data/exports/`).
- `POST /buy-analyzer/analyze` — "Should I Buy This?" purchase analyzer. `multipart/form-data` with an `image` file (the product screenshot) and an optional `context` field (freeform text about the buyer's budget/situation/use case). Returns a structured `BUY`/`WAIT`/`SKIP` verdict with price/spec assessment, likely reviews and common complaints, alternatives, and expected lifespan, generated from the model's own knowledge — there's no live web/review lookup behind it.
- `GET /health` — health check.

## Notes

- The Anthropic client in `utils/threatAgent.js` is constructed lazily on first use, not at module load — this matters because constructing it eagerly throws if `ANTHROPIC_API_KEY` isn't set, which will crash the whole process at startup on any deploy that doesn't have it configured yet.
- `nixpacks.toml` pins the Node provider explicitly for Railway deploys — without it, Nixpacks can misdetect this as a Deno project because of a transitive dependency (`@streamparser/json`, pulled in by `@anthropic-ai/sdk`) that declares Deno support.
