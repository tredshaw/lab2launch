# Lab2Launch — Claude Code Context

## What this project is

A FastAPI web app that helps early-stage technical founders assess their investor readiness. User fills a structured form → Claude asks 3–5 follow-up questions → Claude produces a scored gap analysis report with PDF download.

Portfolio piece for Toby's Anthropic application. The core differentiator is BA methodology (POPIT, SWOT) running invisibly inside the prompts.

Full product spec: `PRD.md`

---

## Stack

| Layer | Tech |
|---|---|
| Backend | Python 3.9, FastAPI, Uvicorn |
| LLM | Anthropic Claude API — haiku for first pass, haiku/sonnet for final |
| Frontend | `static/index.html` — single file, Tailwind CDN, vanilla JS (~1300 lines) |
| PDF | fpdf2 (pure Python) |
| DB | SQLAlchemy + SQLite (`lab2launch.db`) |
| Env | python-dotenv, `.env` with `ANTHROPIC_API_KEY` |

---

## File structure

```
main.py            FastAPI app — all routes
prompts.py         Claude system prompts, API calls, JSON parsing
models.py          SQLAlchemy models (Analysis table)
database.py        DB engine + session factory
pdf_generator.py   fpdf2 PDF generation
static/index.html  Complete frontend
requirements.txt
.env               ANTHROPIC_API_KEY (not committed)
start.sh           Dev server wrapper (sets DYLD_LIBRARY_PATH for macOS)
PRD.md             Full product requirements
```

---

## Running locally

```bash
./start.sh
# or:
DYLD_LIBRARY_PATH=/opt/homebrew/lib venv/bin/uvicorn main:app --reload
```

App at `http://127.0.0.1:8000`. Requires `ANTHROPIC_API_KEY` in `.env`.

Python venv is at `./venv`. Use `venv/bin/python` and `venv/bin/pip`.

---

## Conventions

- All routes in `main.py`. No route splitting.
- All Claude interaction in `prompts.py`. Routes never call the Anthropic client directly.
- Frontend is a single HTML file. Do not split it.
- Pydantic models for all request bodies, defined in `main.py`.
- SQLAlchemy models in `models.py`. Database logic in `database.py`.
- No comments unless the why is non-obvious.
- Match existing code style — no new patterns without a reason.

---

## Testing

There are no automated tests currently. This is a known gap (PRD section 13 — P2).

When the dev pipeline runs its Tester agent:
- Write new tests using `pytest` + `httpx` for route-level integration tests
- Use `venv/bin/pytest` to run
- Do not mock the Claude API — test with real calls or mark as skip
- Manual testing checklist replaces unit tests for now

---

## Git

- Remote: `git@github.com:tredshaw/lab2launch.git`
- Main branch: `main`
- Branch naming: `feature/[short-slug]` or `fix/[short-slug]`
- Dev pipeline creates worktrees at `../worktrees/[branch-name]` relative to this directory

---

## Agent pipelines

This project uses a set of AI agent pipelines defined at:

```
/Users/toby/Documents/Business/Development Team/agents/
```

The relevant pipeline for this project is **Dev** (`dev.md`). When asked to run it:

1. Read `/Users/toby/Documents/Business/Development Team/agents/dev.md` for the full spec
2. Read the Notion backlog (see below) for the target ticket
3. Follow the 4-agent sequence: Technical Design → Implementation Plan → Developer → Tester
4. Save artefacts to `./artefacts/[ticket-slug]/`
5. After Tester completes, pause and ask the user to test locally, then offer to push to GitHub

The other pipelines (Discovery, Strategy, Brand, Marketing) do not operate on this codebase directly — they produce markdown artefacts in the Development Team folder.

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
| `Implementation Version` | text | Auto-scanned from `PRD.md` — see below |
| `Implementation Date` | date | Set to completion date when pipeline finishes |
| `PRD` | file | Ignored — write the technical design as page body content instead |

### Status values and when to set them

| Status | Set when |
|---|---|
| `Not started` | Initial state |
| `Development` | Dev pipeline starts (Technical Design agent begins) |
| `Testing` | Tester agent begins |
| `Implemented Locally` | Tester complete, branch ready, waiting for user to test |
| `Implementation Complete` | User confirms push to GitHub |

### Implementation Version

Scan `PRD.md` in the project root for the line `**Version:**` and read the version number from it. That is the current version. Set `Implementation Version` on the ticket to that value when the pipeline completes.

### PRD on the ticket page

After the Technical Design agent produces `technical-design.md`, write its full content as the body of the Notion ticket page. The ticket page starts blank — this is the intended location for the PRD. Use the `notion-update-page` or `notion-create-pages` tool to write the content.

---

## Known limitations (from PRD)

- No persistence across server restarts (sessions are in-memory)
- No auth / user isolation
- PDF uses Latin-1 encoding — smart quotes and em dashes become `?`
- No rate limiting on API endpoints
- Session TTL cleanup only runs on next request, not on a background timer
