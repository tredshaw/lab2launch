# Implementation Plan — Ticket 1: Strip Persistence Layer

**Ticket:** Strip persistence layer (P0, Ship-V1)
**Worktree:** `.claude/worktrees/affectionate-chandrasekhar-bd96d6`
**Author:** Agent 2 — Implementation Plan
**Source of truth:** `artefacts/strip-persistence-layer/technical-design.md`

---

## Setup

1. Confirm worktree git status is clean (`git status` — no staged or unstaged changes before starting).
2. Confirm cwd is the worktree: `.claude/worktrees/affectionate-chandrasekhar-bd96d6`.
3. Check for the live SQLite DB at the canonical project root (`/Users/toby/Documents/Business/Projects/Lab2Launch/lab2launch codebase/lab2launch.db`). If absent, log it and skip the move step in Task 1 — do NOT fail the pipeline; fresh checkouts won't have one.
4. Confirm Python venv exists at `./venv` (per CLAUDE.md). All Python invocations use `venv/bin/python` / `venv/bin/pytest`.
5. Confirm `backend/VERSION` is readable (consumed at module import in `main.py:22`).
6. Take note of current `backend/main.py` length (285 lines) so post-implementation diff is sanity-checkable.

---

## Tasks

### Task 1: Archive the live SQLite database

- **What:** Move the live `lab2launch.db` file out of the canonical project root into a gitignored `archive/` directory before any code that reads it is deleted. This is the only irreversible step in the ticket — do it first.
- **Files:**
  - Create directory: `<project-root>/archive/` (project root, not worktree — paths resolve identically because the worktree shares the working tree's relative layout, but the live DB lives at the main checkout's cwd where uvicorn last ran).
  - Move: `<project-root>/lab2launch.db` → `<project-root>/archive/lab2launch.db.archive`.
  - Modify: `.gitignore` — append `archive/` line (currently lines 1–8: `.env`, `__pycache__/`, `*.pyc`, `*.pyo`, `venv/`, `.venv/`, `.DS_Store`, `.claude/`, `*.db`).
- **Done when:**
  - `ls <project-root>/lab2launch.db` returns "No such file or directory".
  - `ls <project-root>/archive/lab2launch.db.archive` succeeds (or, if no DB existed at start, the archive dir is empty — log and continue).
  - `grep -q '^archive/$' .gitignore` returns 0.
  - `git status` shows only the `.gitignore` modification staged-ready (the archive dir is now ignored).

### Task 2: Remove the legacy single-page sidebar app

- **What:** Independent change — strip the pre-React `static/index.html` app and every reference to it. Schedulable any time but doing it second keeps the diff focused while persistence code is still intact.
- **Files:**
  - Delete: `backend/static/index.html` and the now-empty `backend/static/` directory.
  - Modify `backend/main.py`:
    - Line 8: `from fastapi.responses import FileResponse, Response` → `from fastapi.responses import Response`.
    - Line 9: delete `from fastapi.staticfiles import StaticFiles`.
    - Line 25: delete `app.mount("/static", StaticFiles(directory="static"), name="static")`.
    - Lines 93–95: delete the entire `@app.get("/")` / `def index()` block returning `FileResponse("static/index.html")`.
  - Modify `frontend/vite.config.ts`: remove the `'/static': 'http://127.0.0.1:8000'` proxy entry. Leave the `/analyses` and other proxy entries untouched.
- **Done when:**
  - `ls backend/static 2>&1` returns "No such file or directory".
  - `git grep -n 'StaticFiles\|static/index.html\|FileResponse' backend/` returns no matches.
  - `git grep -n "'/static'" frontend/` returns no matches.
  - `venv/bin/python -c "import backend.main"` (or equivalent uvicorn boot) does not raise — module still imports while DB code is still present.

### Task 3: Add the `_completed` cache and helpers to `backend/main.py`

- **What:** Introduce the in-memory completed-analyses cache and TTL cleanup function alongside the existing `_sessions` block. Pure addition — no removals yet, so existing routes keep working.
- **Files:**
  - Modify `backend/main.py` between lines 36–48 (the `_sessions` block): add `_completed`, `_COMPLETED_TTL`, and `_cleanup_completed()` immediately below `_cleanup_sessions()`. Mirror the existing pattern exactly (same TTL value, same cleanup style, same epoch-time `created_at` key).
- **Done when:**
  - `_completed: dict[str, dict] = {}` and `_COMPLETED_TTL = 30 * 60` are declared.
  - `_cleanup_completed()` iterates `_completed.items()` and deletes entries where `now - v["created_at"] > _COMPLETED_TTL`.
  - Server boots cleanly with `./start.sh`; `/version` returns 200.
  - No existing route's behaviour has changed (DB-backed routes still work).

### Task 4: Rewire `/first-pass` and `/final-analysis` to use `_completed` (DB code stays in parallel)

- **What:** Make the wizard write its completed result into `_completed` while still writing to the DB row. This dual-write window means the new in-memory reader (Task 5) can be added and the old DB-reader removed without any moment where Results.tsx breaks.
- **Files:**
  - Modify `backend/main.py`:
    - `/first-pass` (lines 98–153): generate `analysis_id = str(uuid.uuid4())` (uuid is already imported at line 2). Stash into `_sessions[session_id]` alongside existing keys: add `analysis_id`, `project_name`, and an `inputs` dict mirroring the §2 shape from technical-design.md (project_name, research_area, stage_value, stage_label, goal_type, goal_quantification, goal_rationale, team_size, q1..q5_answer), plus `follow_up_questions` from `result`. The existing DB row write (lines 120–140) stays for now. Return `analysis_id` (the UUID) instead of `row.id` at line 151. The DB row's `id` column becomes unused-by-frontend but the row still gets created — fine, it goes away in Task 6.
    - `/final-analysis` (lines 156–190): after computing `result`, write the full `_completed[analysis_id] = {...}` entry per technical-design §2 (created_at = `time.time()`, created_at_iso = `datetime.utcnow().isoformat()`, plus inputs, follow_up_questions from session, follow_up_answers from req, result). Call `_cleanup_completed()` at the head of the route. The existing DB update (lines 179–187) stays for now. Return shape unchanged.
- **Done when:**
  - End-to-end wizard run populates a new entry in `_completed` keyed by the UUID returned from `/first-pass`.
  - The DB row is also still written (verifiable by stepping through with a debugger or temporary print — DB still exists during this task; it's archived but the engine creates a fresh empty `lab2launch.db` at module import — that's fine).
  - `/first-pass` response `analysis_id` is a 36-char UUID string.
  - `frontend` Results page still loads via the existing DB-backed `GET /analyses/{id}` route (unchanged so far, still typed `int` — but the frontend is now requesting a UUID, which means this route 404s in practice; **this is intentional and acceptable for the duration of one task** because Task 5 follows immediately and adds the string-typed reader. If the dev wants to verify the cache write before Task 5, do it via a `print(_completed)` log line, not via the Results page).

> **Note on continuity:** The technical design's "no broken window" requirement is satisfied across Tasks 4+5 as a pair. Land them as one commit if you want zero-window continuity, or land Task 4 alone if you're willing to have the Results page 404 between commits — your call as Developer agent.

### Task 5: Replace the DB-backed `GET /analyses/{id}` reader with the cache-backed one

- **What:** Swap the existing DB-querying `GET /analyses/{analysis_id}` (lines 231–259) for the slim cache-reading version from technical-design §4. Path param widens `int -> str`. No other `/analyses*` routes are touched in this task.
- **Files:**
  - Modify `backend/main.py`: replace the route body at lines 231–259 with the §4 implementation:
    - Signature: `def get_analysis(analysis_id: str):` (drop `db: Session = Depends(database.get_db)`).
    - Call `_cleanup_completed()` first.
    - Look up `_completed.get(analysis_id)`; raise 404 with `"Analysis not found or expired"` if missing.
    - Return the same JSON shape as before (id, project_name, created_at = entry["created_at_iso"], inputs, follow_up_questions, follow_up_answers, result).
- **Done when:**
  - Hitting `GET /analyses/<uuid>` for a just-completed analysis returns the full payload.
  - Hitting `GET /analyses/<bogus-uuid>` returns 404 with `{"detail": "Analysis not found or expired"}`.
  - Results.tsx renders correctly end-to-end without any TypeScript or runtime errors.
  - The route signature is `analysis_id: str` (no `int` coercion).

### Task 6: Delete the obsolete history routes and the DB write paths in `/first-pass` and `/final-analysis`

- **What:** Now that the in-memory cache fully serves Results.tsx, rip out the dead code: the three unused history routes and every DB call inside the surviving wizard routes. Imports stay (cleaned up in Task 7).
- **Files:**
  - Modify `backend/main.py`:
    - Delete `GET /analyses` route (lines 211–228).
    - Delete `PATCH /analyses/{id}/name` route (lines 262–269).
    - Delete `DELETE /analyses/{id}` route (lines 272–279).
    - Delete the `RenameRequest` Pydantic model (lines 85–86).
    - In `/first-pass`: delete the `models.Analysis(...)` instantiation, `db.add(row)`, `db.commit()`, `db.refresh(row)` block (lines 120–140). Remove the `db: Session = Depends(database.get_db)` parameter from the signature.
    - In `/final-analysis`: delete the `if analysis_id: row = db.query(...).first(); if row: ...` block (lines 179–187). Remove the `db: Session = Depends(database.get_db)` parameter from the signature. Replace the analysis-id read at line 179 (`session.get("analysis_id")`) with the same lookup against the session — no change needed there, just use it to key into `_completed`.
- **Done when:**
  - `git grep -n 'Depends(database\|db\.add\|db\.query\|db\.commit\|db\.refresh\|db\.delete\|models\.Analysis' backend/` returns no matches.
  - `git grep -n 'RenameRequest' backend/` returns no matches.
  - `git grep -n '@app\.\(patch\|delete\)' backend/` returns no matches.
  - Wizard end-to-end still works; Results page still loads.
  - Acceptance criterion 4 from the technical design (`git grep -nE "database\.|models\.Analysis|Depends\(database"` returns nothing) is satisfied.

### Task 7: Delete `database.py`, `models.py`, and clean up the `main.py` imports

- **What:** With every consumer gone, remove the persistence files themselves and the now-dead imports. Last code-side step before the dependency drop.
- **Files:**
  - Delete: `backend/database.py`.
  - Delete: `backend/models.py`.
  - Modify `backend/main.py`:
    - Line 7: drop `Depends` from the `fastapi` import (no longer used).
    - Line 11: delete `from sqlalchemy.orm import Session`.
    - Lines 13–14: delete `import database` and `import models`.
    - Lines 18–20: delete the `models` reference + `database.Base.metadata.create_all(...)` block.
- **Done when:**
  - `ls backend/database.py backend/models.py 2>&1` returns "No such file or directory" for both.
  - `git grep -n 'sqlalchemy\|database\|models' backend/main.py` returns no matches (other than incidental matches in comments — ideally none).
  - `./start.sh` boots cleanly without `ModuleNotFoundError`.
  - No `lab2launch.db` file is created in the project root on boot.
  - End-to-end wizard run still succeeds.

### Task 8: Drop the `sqlalchemy` dependency

- **What:** Remove `sqlalchemy` from `backend/requirements.txt`. Must come last — any earlier and a partial-state checkout would crash on import.
- **Files:**
  - Modify `backend/requirements.txt`: delete the `sqlalchemy` line (line 6). Leave `weasyprint` (consumed by Ticket 3).
- **Done when:**
  - `grep -i sqlalchemy backend/requirements.txt` returns no matches.
  - `venv/bin/pip install -r backend/requirements.txt` (idempotent — doesn't uninstall) reports nothing to install.
  - `git grep -i sqlalchemy` returns no matches across the whole repo (acceptance criterion 3).

### Task 9: Optional TypeScript widening on `Analysis.id`

- **What:** Cosmetic alignment — widen `Analysis.id` from `number` to `number | string` in Results.tsx so the type matches the new UUID reality. Bundled with the vite.config.ts change from Task 2 if that one still has loose ends, otherwise standalone.
- **Files:**
  - Modify `frontend/src/pages/Results.tsx` line 43: `id: number;` → `id: number | string;`.
  - Re-check `frontend/vite.config.ts` from Task 2 — confirm only the `/static` proxy was removed and no regression.
- **Done when:**
  - `frontend/` typechecks (`cd frontend && npx tsc --noEmit` or whatever the project uses).
  - Results page renders the analysis-id in the error path (line 126, `#{id}`) without a TS warning.
  - This task is genuinely optional per the technical design — skip if behaviour is already green.

---

## Test Strategy

### Manual (primary — per CLAUDE.md, no automated suite exists)

Run after Task 8 completes; spot-check after each earlier task. All tests against `./start.sh` + `cd frontend && npm run dev`.

1. **Full wizard flow end-to-end.** Open `http://localhost:5173`, fill the form (research_area ≥10 chars, all five Qs ≥5 chars), submit, answer follow-ups, confirm Results page renders with scores, dimensions, summary.
2. **PDF download.** From the Results page, click the PDF download button. Confirm the file saves and opens in a PDF viewer with the correct project name in the filename.
3. **Two-incognito-window isolation.** Start two analyses in parallel from two incognito windows. Confirm each Results page shows its own data and neither sees the other's UUID.
4. **Server-restart wipes state.** Complete one analysis. Stop uvicorn (Ctrl-C). Restart with `./start.sh`. Reload the Results page — expect 404 from `GET /analyses/<uuid>` and the React error path to render.
5. **TTL expiry.** Hardest to test naturally; either temporarily lower `_COMPLETED_TTL` to 60s and wait, or call `_cleanup_completed()` manually via a Python REPL after rewinding `entry["created_at"]`. Confirm 404 after expiry.
6. **Direct hit on `/`.** `curl http://localhost:8000/` returns 404 (Ticket 4 will fix this).
7. **No DB created on boot.** After server restart, `ls <project-root>/*.db` returns no matches.
8. **Static mount gone.** `curl http://localhost:8000/static/index.html` returns 404.

### Unit (stretch — only if time)

- `_cleanup_completed()` TTL behaviour:
  - Insert two entries, one with `created_at = time.time() - 31*60` and one with `time.time()`.
  - Call `_cleanup_completed()`.
  - Assert only the fresh one remains.
- File: `backend/tests/test_cleanup.py` (new). Run via `venv/bin/pytest backend/tests/`.

### Integration (stretch — only if time)

- `GET /analyses/{id}` 404 path:
  - Use FastAPI's `TestClient` (httpx-backed) to hit `/analyses/does-not-exist` and assert `response.status_code == 404` and `response.json() == {"detail": "Analysis not found or expired"}`.
- Per CLAUDE.md: do NOT mock the Anthropic API; either skip Claude-touching tests or make real calls. Since this 404 test doesn't touch Claude at all, it's safe and cheap.
- File: `backend/tests/test_routes.py` (new). Run via `venv/bin/pytest`.

---

## Riskiest Task

**Task 1 (Archive the live SQLite database).** It is the only irreversible step in the ticket: if the developer skips, mistypes, or misroutes the `mv` (e.g. moves into a worktree-local `archive/` instead of project-root `archive/`, or forgets the `.archive` suffix and `*.db` gitignore swallows it), real user data could be lost. Every other task in the plan is plain code edits or file deletions that `git restore` / `git revert` can undo cleanly. Task 1 is also the only step that touches state outside the worktree, which makes it harder to inspect via the usual `git status` cycle. Mitigations are baked in: explicit absolute paths, `.archive` suffix, `archive/` listed in `.gitignore` so it's redundantly protected, and a pre-flight `ls` check.
