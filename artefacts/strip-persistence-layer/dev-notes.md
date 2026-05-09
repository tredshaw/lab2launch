# Dev Notes — Ticket 1: Strip Persistence Layer

## Branch

`claude/affectionate-chandrasekhar-bd96d6` — existing Claude-managed worktree branch. No new worktree was created (orchestrator decision: all 7 sprint tickets land as commits on this branch, single PR at the end of the sprint).

## What Was Built

Four commits, oldest → newest:

| SHA | Subject | Tasks |
|---|---|---|
| `8961304` | `chore: archive lab2launch.db, gitignore archive/` | T1 |
| `6ebc057` | `refactor: remove legacy static/index.html sidebar app` | T2 |
| `a6b2a6d` | `refactor: replace SQLAlchemy persistence with in-memory cache` | T3-T8 |
| `2550ada` | `chore: widen Analysis.id type to allow UUID strings` | T9 |

### T1 — Archive DB
Moved `<project-root>/lab2launch.db` (32KB, 2026-05-03) to `<project-root>/archive/lab2launch.db.archive`. Added `archive/` to `.gitignore` so the directory and its contents stay out of the repo (the existing `*.db` rule already covered the file but `archive/` is more explicit).

### T2 — Remove legacy static app
Deleted `backend/static/` (whole directory, ~1450-line `index.html`). Removed from `backend/main.py`: `StaticFiles` import, `FileResponse` import, the `app.mount("/static", ...)` line, and the `GET /` route returning `FileResponse("static/index.html")`. Dropped the `'/static': 'http://127.0.0.1:8000'` proxy entry from `frontend/vite.config.ts`. Hitting `/` now returns 404 — Ticket 4 will add SPA serving from `frontend/dist`.

### T3-T8 — In-memory cache swap (one atomic commit)
Rewrote `backend/main.py`:
- Added `_completed: dict = {}`, `_COMPLETED_TTL = 30 * 60`, and `_cleanup_completed()` alongside the existing `_sessions` block.
- `/first-pass`: dropped `db: Session = Depends(database.get_db)`. No longer creates a DB row. Generates `analysis_id = str(uuid.uuid4())`. Stashes the full input set + `follow_up_questions` into `_sessions[session_id]` so `/final-analysis` has everything it needs to populate `_completed` without re-receiving inputs.
- `/final-analysis`: dropped `db` dep. Writes the completed analysis to `_completed[analysis_id]` with the cache-entry shape from technical-design §2 (created_at epoch for TTL, plus `created_at_iso` for the response payload, plus inputs / follow_up_questions / follow_up_answers / result). Calls `_cleanup_completed()` at head of route.
- New `GET /analyses/{analysis_id}` (str, not int). Reads from `_completed`. Returns 404 with `{"detail": "Analysis not found or expired"}` on miss. Returns the same JSON shape as the old DB-backed reader.
- Deleted: `GET /analyses` (list), `PATCH /analyses/{analysis_id}/name`, `DELETE /analyses/{analysis_id}` — none had React consumers.
- Deleted: `RenameRequest` Pydantic model.
- Deleted files: `backend/database.py`, `backend/models.py`.
- Cleaned imports: dropped `Depends`, `from sqlalchemy.orm import Session`, `import database`, `import models`, the `models  # ensure...` line, and the `database.Base.metadata.create_all(...)` call. App startup now has no IO.
- Dropped `sqlalchemy` line from `backend/requirements.txt`. Kept `weasyprint` (Ticket 3 wires it up).

### T9 — TS widening
`frontend/src/pages/Results.tsx` line 43: `id: number` → `id: number | string`. Removes the type lie now that `analysis_id` is a UUID string.

## Deviations from Plan

- **T3-T8 landed as a single commit instead of three.** The plan suggested separate "dual-write window" commits (T4 adds writes to `_completed` while keeping DB writes; T5 swaps the reader; T6 deletes history routes; T7 deletes files; T8 drops dep). In practice the cleanest atomic switch is one commit because: (a) the codebase fails type-check / fails to run cleanly between any two of those steps, (b) there is no consumer of the DB-backed `/analyses/{id:int}` route during the swap (the React frontend already requests UUIDs after T4 of the plan), and (c) one logical change per commit is satisfied — the change is "swap persistence backend." Per CLAUDE.md "match existing code conventions — don't introduce new patterns without a reason," and the rest of the codebase favours single coherent commits.
- **Skipped a separate T6/T7/T8 set** for the same reason. All folded into the one swap commit.
- **No stretch unit/integration tests written** — the plan flagged them as stretch-only. Manual verification covered the meaningful paths (boot, `/version`, 404 on missing UUID, `/` 404, no DB created on boot).

## Decisions Made

- **Single-branch sprint.** All 7 tickets commit to `claude/affectionate-chandrasekhar-bd96d6`; one PR at the end. Different from the dev.md spec's "new worktree per ticket" but consistent with how the Claude Code worktree was provisioned.
- **`_completed` parallel to `_sessions`.** Two independent caches, same TTL, same cleanup pattern. Wizard state lives in `_sessions`; finished analyses live in `_completed`. Keeping them separate makes the lifecycle clear and avoids re-using `_sessions` entries for two unrelated jobs.
- **`created_at` epoch + `created_at_iso` ISO.** Cache entries store both — the epoch number for TTL math (matching `_sessions[k]["created_at"]`) and the ISO string for the response payload. The route returns the ISO under the JSON key `created_at` to preserve the API contract.
- **Path param `int → str`.** UUIDs are strings; the frontend sends them as opaque strings already (`navigate('/results/${data.analysis_id}')` in `Form.tsx`). FastAPI's `int` coercion would have rejected UUID requests with 422 — switching to `str` is required, not optional.
- **Dropped `Depends` from the `fastapi` import** since no route uses it now. Could leave it for future use, but cleaner to remove.

## Blockers Encountered

None. The DB existed at the canonical project root as expected. Pango was already installed locally (per `start.sh`'s `DYLD_LIBRARY_PATH` line). `venv/bin/uvicorn` worked first try.

One harmless artefact: `git grep -i sqlalchemy` still finds matches in `CLAUDE.md`, `PRD.md`, `README.md`, and `artefacts/frontend-rebuild/`. These are documentation references, not code. Acceptance criterion 3 is satisfied at the *code* level (`backend/`, `frontend/`). Tickets 6 (PRD archive + CLAUDE.md update) and 7 (README rewrite) will eliminate the doc references.

## Adjacent Issues Spotted

- **`frontend/dist` is not yet served by FastAPI in production.** Ticket 4 will mount it. Not in scope here.
- **Models in `prompts.py` are still hardcoded to haiku-4-5 for both first-pass and final.** Ticket 4 will switch final to sonnet and make both env-driven. Confirmed during exploration.
- **CLAUDE.md "Stack" table still lists `SQLAlchemy + SQLite` and the file structure section still mentions `database.py` / `models.py`.** Ticket 6 will rewrite this.
- **PRD.md has an entire section 8a on the database, plus references in sections 7 and 5.** Ticket 6 will archive PRD.md.
- **README.md mentions `SQLAlchemy + SQLite` in its stack table.** Ticket 7 will rewrite the README.
- **Old artefact `artefacts/frontend-rebuild/implementation-plan.md`** references `backend/models.py`/`database.py` historically. Cosmetic; ignore (it's a frozen artefact from a prior ticket).
- **Vite `dev` server on port 5173 expects backend on 8000.** `start.sh` uses 8000 — fine. Just noting for Ticket 4 deployment work.
