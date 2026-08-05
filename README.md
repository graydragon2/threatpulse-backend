# ThreatPulse Backend

Express API that aggregates cybersecurity RSS feeds (CISA, BBC, CNN, and others — see `utils/rssParser.js`), scores/filters them by keyword and risk level, and optionally re-scores them with an LLM-based triage agent. Paired with [threatpulse-frontend](https://github.com/graydragon2/threatpulse-frontend).

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
| `ANTHROPIC_API_KEY` | Only for `?compareAI=true` | Powers `utils/threatAgent.js`'s LLM threat triage. Everything else works without it. |
| `THREAT_AGENT_MODEL` | No | Overrides the default Claude model used for triage |

## API

- `GET /rss` — aggregated, filtered threat feed.
  Query params: `keywords` (comma-separated), `sources` (repeatable), `startDate`, `endDate`, `riskLevel`, `tags` (comma-separated), `compareAI` (`true` to also attach LLM-scored `aiScore`/`aiLevel`/`aiTags`/`aiRationale` alongside the keyword-based score).
- `GET /export/csv`, `GET /export/pdf` — export the current feed.
- `GET /history` — previously generated report metadata.
- `GET /downloads/*` — static download of previously generated export files (`data/exports/`).
- `GET /health` — health check.

## Notes

- The Anthropic client in `utils/threatAgent.js` is constructed lazily on first use, not at module load — this matters because constructing it eagerly throws if `ANTHROPIC_API_KEY` isn't set, which will crash the whole process at startup on any deploy that doesn't have it configured yet.
- `nixpacks.toml` pins the Node provider explicitly for Railway deploys — without it, Nixpacks can misdetect this as a Deno project because of a transitive dependency (`@streamparser/json`, pulled in by `@anthropic-ai/sdk`) that declares Deno support.
