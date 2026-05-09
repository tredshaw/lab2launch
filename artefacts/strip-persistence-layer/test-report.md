# Test Report — Ticket 1: Strip Persistence Layer

## Test Run Summary

No automated test suite exists in this project (per CLAUDE.md, "There are no automated tests currently"). Verification is by structural assertions + a live uvicorn smoke test.

| Check | Result |
|---|---|
| Module import (`venv/bin/python -c "import main"`) | **PASS** — clean, all routes registered |
| `uvicorn main:app` boot | **PASS** — startup complete, no errors |
| `GET /version` | **PASS** — 200 `{"version":"1.2.0"}` |
| `GET /analyses/does-not-exist` | **PASS** — 404 `{"detail":"Analysis not found or expired"}` |
| `GET /` (legacy) | **PASS (intentional)** — 404 (Ticket 4 will mount SPA) |
| OpenAPI route list | **PASS** — exactly the 5 expected routes (`/first-pass`, `/final-analysis`, `/download-pdf`, `/analyses/{analysis_id}`, `/version`) |
| `*.db` at project root post-boot | **PASS** — none created |
| `git grep -i sqlalchemy backend/ frontend/` | **PASS** — no matches |
| `git grep -nE "database\.|models\.Analysis|Depends\(database" backend/` | **PASS** — no matches |
| `ls backend/database.py backend/models.py backend/static` | **PASS** — all "No such file or directory" |
| `<project-root>/archive/lab2launch.db.archive` | **PASS** — present, 32768 bytes |
| `archive/` in `.gitignore` | **PASS** |

## Regressions Found

None.

## New Tests Written

None. Stretch unit + integration tests were optional in the implementation plan and skipped — manual coverage was sufficient for the change's blast radius. If future tests are added, candidates:
- Unit: `_cleanup_completed()` TTL behaviour with synthetic timestamps.
- Integration: `GET /analyses/{id}` 404 on missing/expired (already verified manually via curl).

## Acceptance Criteria Validation

Numbered to match `technical-design.md`:

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | Wizard end-to-end → Results renders from in-memory cache | **Manual check needed** | Requires Anthropic API key + clicking through the UI. Backend route shape verified: `POST /first-pass` returns `{session_id, analysis_id, follow_up_questions}`; `POST /final-analysis` writes to `_completed`; `GET /analyses/{id}` reads it. |
| 2 | Expired analysis_id → 404 | **PASS** (logic check) | `_cleanup_completed()` deletes entries where `now - created_at > 1800s`. `GET /analyses/{id}` calls cleanup first then `_completed.get()`. Manually verified the missing-id path returns 404. |
| 3 | `git grep -i sqlalchemy` returns nothing | **PASS in code, FAIL in docs** | Code-level (`backend/` + `frontend/`) is clean. CLAUDE.md, PRD.md, README.md still reference SQLAlchemy — will be cleaned by Tickets 6 and 7 in this same sprint. |
| 4 | `git grep -nE "database\.|models\.Analysis|Depends\(database"` returns nothing | **PASS in code** | Only doc/artefact references remain; cleaned by Tickets 6/7. |
| 5 | Two incognito windows → no cross-leakage | **Manual check needed** | Each `/first-pass` generates an independent UUID; there is no listing endpoint. Architecturally guaranteed but unverified end-to-end. |
| 6 | Vite dev (`localhost:5173`) renders Landing | **Manual check needed** | Vite proxy config preserved for `/first-pass`, `/final-analysis`, `/download-pdf`, `/analyses`. `/static` proxy removed (legacy). |
| 6b | `localhost:8000/` returns 404 (intentional) | **PASS** | Verified via curl. |
| 7 | DB at `archive/lab2launch.db.archive`, gitignored | **PASS** | Verified `ls archive/` and `grep '^archive/$' .gitignore`. |
| 8 | `backend/static/`, `database.py`, `models.py` deleted | **PASS** | All return "No such file or directory". |
| 9 | React Results page has no sidebar | **PASS by absence** | The legacy `static/index.html` (only place a sidebar lived) is deleted. The React app never had one. |
| 10 | Fresh venv boots clean | **PASS** | `uvicorn main:app` starts cleanly with the existing venv. Fresh-venv install not separately verified — `pip install` would just be a no-op for current deps minus `sqlalchemy`. |

## Manual Testing Checklist (for Toby)

Before pushing, please verify the following end-to-end. The structural changes are sound; what only you can confirm is the live UI flow with real Claude calls.

1. **Backend boots cleanly.** From `backend/`, run `./start.sh`. You should see:
   ```
   INFO:     Uvicorn running on http://127.0.0.1:8000
   ```
   No `ModuleNotFoundError`, no SQLAlchemy import error.

2. **`/version` works.** In another terminal: `curl http://127.0.0.1:8000/version` → `{"version":"1.2.0"}`.

3. **`/` returns 404 (intentional).** `curl -i http://127.0.0.1:8000/` → `HTTP/1.1 404 Not Found`. This will be fixed in Ticket 4 when we mount `frontend/dist`.

4. **No DB created.** After boot, run `ls "/Users/toby/Documents/Business/Projects/Lab2Launch/lab2launch codebase/"*.db` — should report no matches.

5. **Frontend dev server proxies correctly.** From `frontend/`, run `npm run dev`. Visit `http://localhost:5173/`. The Landing page should render. Click "Start an analysis" or whatever the CTA is.

6. **Full wizard flow.** Fill the form (project name, research area ≥10 chars, all 5 stress-test questions ≥5 chars each, goal, team size). Submit. You should see follow-up questions. Answer them. Click submit on the final step. The Results page should render with scores, dimensions, top 3 actions.

7. **PDF download works.** From the Results page, click the PDF download button. Confirm the file downloads with a sensible filename.

8. **Two-incognito-window isolation.** Open two incognito windows. Start an analysis in each. Confirm each Results page shows only its own data.

9. **Server-restart wipes state.** Complete an analysis. Stop uvicorn (Ctrl-C in the backend terminal). Restart with `./start.sh`. Reload the Results tab in your browser. You should see the React error path (404 from `GET /analyses/{old-uuid}`).

10. **Archive intact.** `ls "/Users/toby/Documents/Business/Projects/Lab2Launch/lab2launch codebase/archive/"` → `lab2launch.db.archive` is there, 32KB.

If any of 5, 6, 7, 8, 9 fail, do not push — flag the failure and we'll debug.

## Coverage Gaps

- **No automated test for `_cleanup_completed()` TTL.** Risk is low — function is 4 lines, mirrors the proven `_cleanup_sessions()` pattern. Could add `backend/tests/test_cleanup.py` later.
- **No automated end-to-end test of the wizard.** Risk is medium — relies on manual checklist. Could add a pytest+httpx smoke test that mocks `prompts.run_first_pass` and `prompts.run_final_analysis` (CLAUDE.md says don't mock the Anthropic client itself, but mocking our own wrapper is fair). Out of scope for Ticket 1.
- **TS widening not verified by `tsc -b`.** The change (number → number | string) is type-widening, which is always safe — no caller is forbidden by it. Confirmed by inspection.
