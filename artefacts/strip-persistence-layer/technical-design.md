# Technical Design — Ticket 1: Strip Persistence Layer

**Ticket:** Strip persistence layer (P0, Ship-V1)
**Worktree:** `.claude/worktrees/affectionate-chandrasekhar-bd96d6`
**Author:** Agent 1 — Technical Design

---

## Scope

**In scope**
- Delete server-side persistence: remove `backend/database.py`, `backend/models.py`, the `sqlalchemy` dependency, and all DB plumbing in `backend/main.py` (imports, `Base.metadata.create_all`, `Depends(database.get_db)` on every route, the four `/analyses*` routes at `main.py:211-279`).
- Introduce an in-memory `_completed: dict[str, dict]` cache in `backend/main.py` for finished analyses, keyed by UUID, 30-min TTL, lazy cleanup matching the existing `_sessions` pattern.
- Add a slim `GET /analyses/{analysis_id}` reader that serves the cache so `frontend/src/pages/Results.tsx:115` keeps working unchanged.
- `analysis_id` returned by `/first-pass` and `/final-analysis` becomes a UUID string instead of an integer DB row id; the response contract shape is otherwise unchanged for the React frontend.
- Archive the existing SQLite DB (`lab2launch.db`) to `archive/lab2launch.db.archive` and add `archive/` to `.gitignore`.
- Delete the legacy single-page sidebar app at `backend/static/index.html` and remove its mount from `backend/main.py` (the `app.mount("/static", ...)` line and the `GET /` `FileResponse("static/index.html")` route).

**Out of scope** (handled by other tickets / deferred)
- PDF redesign with WeasyPrint — Ticket 3.
- Env-driven model selection and `/health` endpoint — Ticket 4.
- Admin dashboard with magic-link auth — Ticket 5.
- SPA fallback so FastAPI serves `frontend/dist` for direct `/results/:id` loads — Ticket 4 (in dev, the Vite proxy in `frontend/vite.config.ts` already handles routing).
- README / PRD updates — Ticket 6.

---

## Technical Approach

### 1. In-memory completed-analyses cache

A new module-level dict in `backend/main.py`, mirroring the existing `_sessions` structure:

```python
_completed: dict[str, dict] = {}
_COMPLETED_TTL = 30 * 60  # 30 minutes, matches _sessions

def _cleanup_completed() -> None:
    now = time.time()
    expired = [k for k, v in _completed.items() if now - v["created_at"] > _COMPLETED_TTL]
    for k in expired:
        del _completed[k]
```

The cleanup function is called at the head of every route that reads or writes `_completed` (lazy cleanup, matching the existing `_cleanup_sessions()` pattern at `main.py:43`).

`_sessions` and its TTL stay exactly as they are. The two caches are independent: `_sessions` holds wizard state between `/first-pass` and `/final-analysis`; `_completed` holds the final analysis from `/final-analysis` onwards so `Results.tsx` can read it.

### 2. Cache entry shape

Each entry mirrors the response shape Results.tsx expects (see `Analysis` interface at `Results.tsx:42-47` — `{id, project_name, created_at, result}`) plus the input fields the existing `GET /analyses/{id}` returns (kept for parity in case the PDF route or future UI needs them):

```python
_completed[analysis_id] = {
    "created_at": time.time(),               # for TTL check
    "id": analysis_id,                       # UUID string
    "project_name": req.project_name or "Untitled",
    "created_at_iso": datetime.utcnow().isoformat(),  # for response payload
    "inputs": {
        "project_name": ..., "research_area": ..., "stage_value": ...,
        "stage_label": ..., "goal_type": ..., "goal_quantification": ...,
        "goal_rationale": ..., "team_size": ...,
        "q1_answer": ..., "q2_answer": ..., "q3_answer": ...,
        "q4_answer": ..., "q5_answer": ...,
    },
    "follow_up_questions": [...],
    "follow_up_answers":   [...],
    "result":              {...},  # Claude's final analysis JSON
}
```

`created_at` (numeric epoch) is reserved for the TTL sweep, paralleling `_sessions[k]["created_at"]`. The ISO string returned to the frontend is stored under `created_at_iso` and surfaced as `created_at` in the response body to preserve the existing API shape.

### 3. analysis_id flow

| Step | Old | New |
|---|---|---|
| `/first-pass` | Inserts `Analysis` row, returns `analysis_id = row.id` (int) | Generates `analysis_id = str(uuid.uuid4())`, stashes it in `_sessions[session_id]["analysis_id"]`, returns it. **Nothing is written to `_completed` yet** — wizard still in flight. |
| `/final-analysis` | Updates row with `analysis_result`, returns `{**result, "analysis_id": analysis_id}` | Reads `analysis_id` out of the session, writes the full entry to `_completed[analysis_id]`, deletes the session, returns `{**result, "analysis_id": analysis_id}`. |
| `GET /analyses/{id}` | Queried DB | Reads `_completed[id]`, calls `_cleanup_completed()` first, 404 if missing or expired. |

The frontend (`Form.tsx:71-72` and `Form.tsx:97`) stores `data.analysis_id` and navigates to `/results/${data.analysis_id}`. It treats it as opaque — the `Analysis.id` interface field at `Results.tsx:43` is typed `number` but only used for display in the error path (`#{id}` at line 126) where it stringifies fine. Widen to `id: number | string` in `Results.tsx` to remove the lie; no behavioural change.

### 4. The slim `GET /analyses/{id}` reader

```python
@app.get("/analyses/{analysis_id}")
def get_analysis(analysis_id: str):
    _cleanup_completed()
    entry = _completed.get(analysis_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Analysis not found or expired")
    return {
        "id": entry["id"],
        "project_name": entry["project_name"],
        "created_at": entry["created_at_iso"],
        "inputs": entry["inputs"],
        "follow_up_questions": entry["follow_up_questions"],
        "follow_up_answers":   entry["follow_up_answers"],
        "result":              entry["result"],
    }
```

Path param type changes `int -> str` (UUIDs are not integers).

### 5. Database archival mechanics

The SQLite file lives in the canonical project root (gitignored via `*.db` so it does not appear in the worktree checkout). Archival happens in the project root, not the worktree. Steps the Developer agent executes:

1. Create `archive/` directory in worktree (this gets committed via `.gitignore` change).
2. Move the live DB: `mv "<project-root>/lab2launch.db" "<project-root>/archive/lab2launch.db.archive"` — the `.archive` suffix prevents `*.db` gitignore from matching, but `archive/` will be gitignored anyway.
3. Confirm with `ls`.
4. Append `archive/` to `.gitignore`.
5. Only after archival succeeds, delete `backend/database.py` and `backend/models.py`.

If `lab2launch.db` doesn't exist (fresh checkout), the Developer logs that and proceeds — no failure.

### 6. Legacy `static/index.html` removal

`backend/static/index.html` is the pre-React sidebar app. The React app at `frontend/` is the supported frontend. Remove:
- The directory `backend/static/` (whole directory).
- `from fastapi.staticfiles import StaticFiles` import at `main.py:9`.
- `app.mount("/static", StaticFiles(directory="static"), name="static")` at `main.py:25`.
- `from fastapi.responses import FileResponse, Response` → keep only `Response` (used by `/download-pdf` at `main.py:200`).
- `@app.get("/")` route at `main.py:93-95` returning `FileResponse("static/index.html")` — delete entirely.
- Update `frontend/vite.config.ts` — remove the `/static` proxy entry.

After Ticket 4 lands, `/` will serve the React build; for now (V1 strip), `/` returns a default 404, which is acceptable because dev users land on `http://localhost:5173` (Vite).

### 7. Process-locality of in-memory state

The cache is process-local. If uvicorn is run with `--workers > 1`, the cache won't be shared and Results page loads will sometimes 404. `start.sh` uses `--reload`, single-worker. Production / Ticket 4's deployment must keep workers=1 — flagged in **Risks**.

---

## Data Model Changes

**Removed**
- `backend/models.py::Analysis` SQLAlchemy ORM class (entire file).
- `backend/database.py` (engine, session factory, `Base`, `get_db`).
- The `analyses` SQLite table (archived, not migrated).

**Added (in-memory only)**
- `_completed: dict[str, dict]` in `backend/main.py`, shape documented in §2 above.

No new Pydantic models. The `RenameRequest` model at `main.py:85-86` is removed because the `PATCH /analyses/{id}/name` route is removed.

---

## API / Interface Changes

**Routes removed** (currently at `backend/main.py:211-279`)
| Method | Path | Notes |
|---|---|---|
| GET | `/analyses` | List view — no consumer in React frontend. |
| PATCH | `/analyses/{id}/name` | Rename — no consumer. |
| DELETE | `/analyses/{id}` | Delete — no consumer. |

**Routes removed** (legacy)
| Method | Path | Notes |
|---|---|---|
| GET | `/` | Served `static/index.html` — legacy sidebar app. |
| GET | `/static/*` | Mount removed. |

**Routes kept, reimplemented**
| Method | Path | Change |
|---|---|---|
| GET | `/analyses/{analysis_id}` | Path param `int -> str`. Reads from `_completed`. Same response JSON shape. 404 if missing / TTL-expired. |

**Routes kept, internal-only changes**
| Method | Path | Change |
|---|---|---|
| POST | `/first-pass` | Drops `db: Session = Depends(database.get_db)` parameter. Generates UUID for `analysis_id`. No DB row write. Stashes `analysis_id`, `project_name`, full input set into `_sessions[session_id]` so `/final-analysis` can build the `_completed` entry. |
| POST | `/final-analysis` | Drops `db` parameter. Writes the completed analysis to `_completed[analysis_id]`. Returns `{**result, "analysis_id": analysis_id}` unchanged. |
| POST | `/download-pdf` | Unchanged. |
| GET | `/version` | Unchanged. |

**Response shape changes**
- `analysis_id` is now a UUID string instead of an integer. Frontend treats it as opaque.

---

## Integration Points

| File | Change |
|---|---|
| `backend/main.py` | Major rewrite. Drop `Depends`, `from sqlalchemy.orm import Session`, `import database`, `import models`, `models  # ensure...` line, `database.Base.metadata.create_all(...)`. Remove `FileResponse` from `fastapi.responses` import. Drop `StaticFiles` import. Drop `app.mount("/static", ...)`. Drop `RenameRequest`. Drop `GET /` route. Rewrite `/first-pass` — remove `db` param, drop the `models.Analysis(...)` block, replace with UUID generation and richer `_sessions` payload. Rewrite `/final-analysis` — remove `db` param, replace the `db.query(...).first()` block with `_completed[analysis_id] = {...}` and `_cleanup_completed()`. Delete the four `/analyses*` routes. Replace with new in-memory `GET /analyses/{analysis_id}` (string-typed). Add `_completed`, `_COMPLETED_TTL`, `_cleanup_completed()` near existing `_sessions` block. |
| `backend/database.py` | **Delete file.** |
| `backend/models.py` | **Delete file.** |
| `backend/static/index.html` | **Delete file.** Then delete the now-empty `backend/static/` directory. |
| `backend/requirements.txt` | Remove `sqlalchemy` line. Keep everything else. |
| `backend/prompts.py`, `backend/pdf_generator.py` | No change. |
| `frontend/src/pages/Results.tsx` | Optional: change `id: number` to `id: number \| string` in the `Analysis` interface (line 43). |
| `frontend/vite.config.ts` | Remove the `'/static': 'http://127.0.0.1:8000'` proxy entry. The `/analyses` proxy entry stays. |
| `.gitignore` | Add `archive/` line. |
| `<project-root>/lab2launch.db` | Move to `<project-root>/archive/lab2launch.db.archive`. |

**Lifecycle / startup**
The `database.Base.metadata.create_all(...)` call at module import is the only DB lifecycle hook today. After this ticket, app startup has no IO — just dict initialization.

CORS, middleware, version endpoint — unchanged.

---

## Acceptance Criteria

1. **Given** a fresh server, **when** a user completes the wizard end-to-end, **then** `GET /analyses/{id}` returns the full analysis JSON from the in-memory `_completed` cache and the Results page renders without error.
2. **Given** an `analysis_id` whose `_completed` entry was created more than 30 minutes ago, **when** any route triggers `_cleanup_completed()` and `GET /analyses/{id}` is called, **then** the response is `404 {"detail": "Analysis not found or expired"}`.
3. **Given** the codebase after this ticket lands, **when** running `git grep -i sqlalchemy`, **then** no matches are returned.
4. **Given** the codebase after this ticket lands, **when** running `git grep -nE "database\.|models\.Analysis|Depends\(database"`, **then** no matches are returned.
5. **Given** two users in separate incognito windows submitting analyses concurrently, **when** each views their own results page, **then** each fetches only their own `analysis_id` and neither sees the other's data.
6. **Given** the backend is started, **when** the user visits `http://localhost:5173/` (Vite dev), **then** the React `Landing.tsx` renders. **Given** the backend is started, **when** the user hits `http://localhost:8000/` directly, **then** a 404 is returned (intentional — Ticket 4 will add SPA serving).
7. **Given** `lab2launch.db` existed at the project root before this ticket, **when** the ticket completes, **then** the file lives at `<project-root>/archive/lab2launch.db.archive`, no `*.db` file exists at the project root, and `archive/` is listed in `.gitignore`.
8. **Given** the codebase after this ticket lands, **when** running `ls backend/static/ backend/database.py backend/models.py 2>&1`, **then** every path returns "No such file or directory".
9. **Given** the React Results page after this ticket lands, **when** it renders a completed analysis, **then** no sidebar / history navigation is visible.
10. **Given** `pip install -r backend/requirements.txt` is run from a clean venv, **when** the server starts, **then** it boots without ModuleNotFoundError, no SQLite file is created, and `POST /first-pass` succeeds end-to-end.

---

## Technical Risks

1. **Live database has data.** Archive must complete before code deletion or data is irrecoverable. Mitigation: explicit step ordering, `.archive` suffix, plus `archive/` added to gitignore.
2. **Process-local state with multi-worker uvicorn.** If anyone runs uvicorn `--workers N>1`, `_completed` cache fragments and Results pages will intermittently 404. Flag prominently for Ticket 4.
3. **State lost on server restart.** Acknowledged and accepted by the V1 plan.
4. **TTL semantics.** A user idle for 31 minutes between completing the wizard and opening the Results tab sees a 404. Realistic window is seconds — acceptable.
5. **Concurrent dict mutation.** Same pattern as existing `_sessions`. No new concern.
6. **TypeScript type drift.** `Analysis.id: number` becomes a lie; widen to `number | string`.
7. **PDF download flow.** Posts `analysis` body to `/download-pdf` — unaffected.
8. **Removed `GET /` will surface as a 404.** No production user is hitting it. Resolved by Ticket 4.

---

## Deferred / Out of Scope

- **SPA fallback for direct `/results/:id` loads in production** — Ticket 4.
- **Env-driven model selection and `/health` endpoint** — Ticket 4.
- **PDF rebuild with WeasyPrint** — Ticket 3 (`weasyprint` is already in `requirements.txt` but unused — leave it).
- **Admin dashboard with magic-link auth** — Ticket 5.
- **PRD / README updates** — Ticket 6 / 7.
- **Persistence story for production scale** — out of V1 entirely.

---

### Critical Files for Implementation

- `backend/main.py`
- `backend/database.py`
- `backend/models.py`
- `backend/requirements.txt`
- `backend/static/index.html`
- `frontend/src/pages/Results.tsx`
- `frontend/vite.config.ts`
- `.gitignore`
- Project-root `lab2launch.db` (archived, not in git)
