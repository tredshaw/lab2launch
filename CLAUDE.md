# Lab2Launch — Claude Code Context

## What this project is

A FastAPI + React/Vite web app that helps early-stage technical founders assess their investor readiness. User fills a structured form → Claude asks 3–5 follow-up questions → Claude produces a scored gap analysis report with a PDF download. The differentiator is BA methodology (POPIT, SWOT, Stakeholder Analysis) running invisibly inside the prompts.

The app is intentionally **stateless and one-shot**: there is no user account, no persistence of completed analyses on the server, and no shared sidebar. The PDF the user downloads is their only artefact. This is a deliberate design — privacy by default and simplicity over a hosted database.

---

## Stack

| Layer | Tech |
|---|---|
| Backend | Python 3.9, FastAPI, Uvicorn |
| LLM | Anthropic Claude API — env-driven: haiku for first pass, sonnet for final |
| Frontend | React 19 + Vite + TypeScript (`frontend/`) |
| PDF | WeasyPrint (Pango/Cairo system deps) + Jinja2 templates |
| Auth (admin only) | itsdangerous signed cookies + Resend magic link |
| Env | python-dotenv, `.env` with `ANTHROPIC_API_KEY` |

---

## File structure

```
backend/
  main.py            FastAPI app — all routes; in-memory session + completed caches
  prompts.py         Claude system prompts, API calls, JSON parsing, metrics-wrapped
  pdf_generator.py   WeasyPrint PDF generation (Jinja2 template at templates/)
  metrics.py         In-memory MetricsCollector singleton (token usage, cost, latency)
  admin.py           /admin router — magic-link auth + dashboard
  templates/
    pdf_report.html  PDF Jinja2 template
    pdf_report.css   PDF stylesheet
    admin_login.html Login form template
    admin_dashboard.html Admin dashboard template
    admin.css        Admin stylesheet
  requirements.txt
  start.sh           Dev server wrapper (sets DYLD_LIBRARY_PATH for macOS)
  VERSION

frontend/
  src/
    pages/           Landing, Form (8-step wizard), Results
    components/      TopNav, RadarChart, Tag, Button, etc.
    tokens/          Design tokens (cream/navy/lime palette)
    hooks/           useWizard
  vite.config.ts     Dev proxy /first-pass /final-analysis /download-pdf /analyses → :8000
  package.json

render.yaml          Deployment manifest (single web service, builds frontend + backend)
.env                 ANTHROPIC_API_KEY etc. (not committed)
```

---

## Running locally

**Backend** (terminal 1):
```bash
cd backend
./start.sh
```
App API at `http://127.0.0.1:8000`. Requires `ANTHROPIC_API_KEY` in `.env` at the repo root.

**Frontend** (terminal 2):
```bash
cd frontend
npm install        # first time only
npm run dev
```
App UI at `http://127.0.0.1:5173`. Vite proxies API calls to the backend.

Python venv is at `./venv` (repo root, shared by all worktrees). Use `venv/bin/python` and `venv/bin/pip`.

WeasyPrint requires Pango/Cairo: `brew install pango cairo`.

---

## Conventions

- All HTTP routes in `backend/main.py` (plus the `admin` router at `backend/admin.py`).
- All Claude interaction in `backend/prompts.py`. Routes never call the Anthropic client directly. Calls flow through `_call_claude()` which records metrics.
- Pydantic models for all request bodies, defined in `main.py`.
- Frontend is a real React/Vite app. New pages go in `frontend/src/pages/`; reusable components in `frontend/src/components/`. Design tokens in `frontend/src/tokens/`.
- No comments unless the *why* is non-obvious.
- Match existing code style — no new patterns without a reason.

---

## State model

Two in-memory dicts in `main.py`, both with 30-min TTL and lazy cleanup on the next relevant request:

- `_sessions` — wizard state between `/first-pass` and `/final-analysis`. Keyed by session UUID. Includes inputs, follow-up questions, the analysis_id we'll write later.
- `_completed` — finished analyses, served back to the React Results page via `GET /analyses/{id}`. Keyed by analysis UUID.

Server restart wipes both. By design — single-worker uvicorn, one-shot tool.

`metrics.py` holds a third in-memory store (call records, completed analyses, errors) that powers the admin dashboard. Same restart-wipes-all rule.

---

## Testing

There are no automated tests currently.

When the dev pipeline runs its Tester agent:
- Write new tests using `pytest` + `httpx` for route-level integration tests.
- Use `venv/bin/pytest` to run.
- Do not mock the Claude API — test with real calls or mark as skip.
- Manual testing checklist replaces unit tests for now.

---

## Git

- Remote: `git@github.com:tredshaw/lab2launch.git`
- Main branch: `main`
- Branch naming: `feature/[short-slug]` or `fix/[short-slug]`
- Dev pipeline creates worktrees at `../worktrees/[branch-name]` relative to this directory

---

## Deployment

Single Render web service defined in `render.yaml` at the repo root. The build:
1. apt-installs Pango/Cairo/HarfBuzz/Fontconfig
2. `npm ci && npm run build` in `frontend/` to produce `frontend/dist`
3. `pip install -r backend/requirements.txt`

The runtime serves both the API and the SPA: when `ENVIRONMENT=production` and `frontend/dist` exists, FastAPI mounts `dist/assets` and falls through unmatched GETs to `index.html` so React Router can take over. In dev, Vite handles the frontend on :5173.

Required Render env vars (set in the dashboard, not in `render.yaml`): `ANTHROPIC_API_KEY`, `SESSION_SECRET`, `RESEND_API_KEY`. Optional: `MODEL_FIRST_PASS`, `MODEL_FINAL`, `PUBLIC_URL`.

---

## Admin dashboard

`/admin` is a single-recipient operations dashboard at `toby@redshaw.me`. Magic-link sign-in: enter email, receive a one-time signed token via Resend, click → 7-day signed session cookie. If `RESEND_API_KEY` is unset, the link is printed to stdout for local dev.

Dashboard shows live spend (today/week/month/session), volume, p95 latency per route, last-24h error count, and the last 20 completed analyses (timestamp, project name, total score, model — no analysis content). State is in-memory and resets on restart.

---

## Agent pipelines

This project uses a set of AI agent pipelines defined at:

```
/Users/toby/Documents/Business/Development Team/agents/
```

The relevant pipeline for this project is **Dev** (`dev.md`). When asked to run it:

1. Read `/Users/toby/Documents/Business/Development Team/agents/dev.md` for the full spec.
2. Read the Notion backlog (see below) for the target ticket.
3. Follow the 4-agent sequence: Technical Design → Implementation Plan → Developer → Tester.
4. Save artefacts to `./artefacts/[ticket-slug]/`.
5. After Tester completes, pause and ask the user to test locally, then offer to push to GitHub.

The other pipelines (Discovery, Strategy, Brand, Marketing) do not operate on this codebase directly.

---

## Notion backlog

**Database:** Lab2Launch Features  
**URL:** `https://www.notion.so/3560cb7ecc0a8010a678db6c11ab402f`  
**Data source ID:** `collection://3560cb7e-cc0a-80fa-addc-000b35148f08`

### Fields

| Field | Type | Notes |
|---|---|---|
| `Feature` | title | Ticket name |
| `Description` | text | Full ticket description |
| `Priority` | select | P0, P1, P2, P3 |
| `Status` | status | See values below |
| `Implementation Version` | text | Sprint/version label, e.g. `Ship-V1` |
| `Implementation Date` | date | Set to completion date when pipeline finishes |

### Status values and when to set them

| Status | Set when |
|---|---|
| `Not started` | Initial state |
| `Development` | Dev pipeline starts (Technical Design agent begins) |
| `Testing` | Tester agent begins |
| `Implemented Locally` | Tester complete, branch ready, waiting for user to test |
| `Implementation Complete` | User confirms push to GitHub |

### Technical design on the ticket page

After the Technical Design agent produces `technical-design.md`, write its full content as the body of the Notion ticket page using the Notion MCP. The ticket page starts blank — this is the intended location.

---

## Known limitations

- No persistence across server restarts — by design (download the PDF or lose it).
- No multi-user accounts — by design.
- Single-worker uvicorn assumed — multi-worker would fragment the in-memory caches across processes.
- No rate limiting on API endpoints — would need to add if abuse appears.
- Session and cache cleanup runs on next relevant request, not on a background timer.
