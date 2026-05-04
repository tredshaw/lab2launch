# Lab2Launch — Product Requirements Document
**Version:** 1.2  
**Date:** 2026-05-03  
**Status:** Current / Shipped

---

## 1. Purpose

Lab2Launch is a web application that helps early-stage technical founders (primarily academic researchers commercialising science) understand how investor-ready their project is. The user answers a structured intake form, Claude asks 3–5 clarifying questions, and the system produces a structured gap analysis report with scores, priority actions, and a PDF download.

**Primary audience:** Deep tech and biomedical researchers at pre-seed to seed stage who are unfamiliar with commercial due diligence.

**Secondary purpose:** Portfolio piece for Toby Redshaw's Anthropic "Applied AI Architect, Startups" application. The BA methodology (POPIT, SWOT) running invisibly inside the prompts is the product's core differentiator from a generic GPT wrapper.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.9, FastAPI |
| LLM | Anthropic Claude API (`claude-haiku-4-5-20251001` dev / `claude-sonnet-4-6` demo) |
| Frontend | Single HTML file, Tailwind CSS (CDN), vanilla JS |
| PDF | fpdf2 (pure Python, no system deps) |
| Database | SQLAlchemy ORM + SQLite (local file `lab2launch.db`; swap to Postgres via `DATABASE_URL` env var) |
| Server | Uvicorn with `--reload` |
| Env | python-dotenv, `.env` with `ANTHROPIC_API_KEY` |

**No auth. No multi-user isolation.** In-progress session state is in-memory; completed analyses are persisted to SQLite.

---

## 3. File Structure

```
lab2launch codebase/
├── main.py              # FastAPI app, all routes
├── prompts.py           # Claude prompts, API calls, JSON parsing
├── pdf_generator.py     # fpdf2 PDF generation
├── database.py          # SQLAlchemy engine, SessionLocal, get_db dependency
├── models.py            # Analysis ORM model
├── lab2launch.db        # SQLite database (auto-created on first run, not committed)
├── static/
│   └── index.html       # Complete frontend (HTML + CSS + JS, ~1300 lines)
├── requirements.txt
├── .env                 # ANTHROPIC_API_KEY (not committed)
├── .env.example
├── start.sh             # Dev server wrapper (sets DYLD_LIBRARY_PATH for macOS)
└── PRD.md               # This document
```

---

## 4. Running Locally

```bash
# One-time setup
python -m venv venv
venv/bin/pip install -r requirements.txt

# Start server
./start.sh
# or: DYLD_LIBRARY_PATH=/opt/homebrew/lib venv/bin/uvicorn main:app --reload
```

App available at `http://127.0.0.1:8000`.

**Required env vars in `.env`:**
```
ANTHROPIC_API_KEY=sk-ant-...
```

**Optional env vars:**
```
DATABASE_URL=postgresql://user:pass@host/db   # omit to use local SQLite
```

`lab2launch.db` is created automatically in the working directory on first run.

---

## 5. User Journey

The app has four sequential views:

### View 1: Form (`form-view`)
User fills in:
- Project name (optional, display only)
- Research area (textarea, 200+ words recommended)
- Stage slider (6 stops, dual-labelled)
- Team size (number)
- Goal type (dropdown)
- Goal quantification (textarea, dynamic placeholder)
- Goal rationale (textarea)
- 5 investor stress test questions (textareas)

On submit → **Step 1: First Pass**

### View 2: Loading (`loading-view`)
Dynamic message. First pass shows "Reading your inputs… / Identifying what to ask you next". Final analysis shows "Generating your analysis… / Applying POPIT framework and investor readiness criteria".

### View 3: Follow-up Questions (`followup-view`)
Displays 3–5 Claude-generated questions. Each has:
- Question text
- `why_asked` helper text (teal, smaller)
- Textarea for answer

On submit → **Step 2: Final Analysis**

### View 4: Dashboard (`dashboard-view`)
Displays the full report. Sections in order:
1. Summary header (project name, plain English summary, total score/50, stage label)
2. Your Assets (3–5 bullets with green ✓ icons)
3. Readiness Radar (SVG, /10 scale) + Top 3 Actions side-by-side
4. Where You Are vs. Where You Need to Be (5 dimension cards)
5. Methodology footer (collapsible)

---

## 6. Input Form — Complete Field Specification

### 6.1 Project Context

| Field | ID | Type | Required | Validation |
|---|---|---|---|---|
| Project name | `project_name` | text | No | Sent to server, stored in DB; defaults to "Untitled" |
| Research area | `research_area` | textarea | Yes | min 10 chars |
| Current stage | `stage_slider` | range 1–6 | Yes | Integer 1–6 |
| Team size | `team_size` | number | Yes | 1–500 |

**Stage slider labels (dual-label):**

| Value | VC label | Researcher label |
|---|---|---|
| 1 | Pre-seed (idea) | Concept / no prototype |
| 2 | Pre-seed (prototype) | Working prototype |
| 3 | Seed | First validation / pilots |
| 4 | Seed-extension | Multiple pilots / first revenue |
| 5 | Series A | Repeatable revenue / scaling |
| 6 | Beyond Series A | Established / mature |

### 6.2 Structured Goal

| Field | ID | Type | Required | Notes |
|---|---|---|---|---|
| Goal type | `goal_type` | select | Yes | 7 options (see below) |
| Quantification | `goal_quantification` | textarea | Yes | min 5 chars; placeholder changes with goal_type |
| Why this, why now | `goal_rationale` | textarea | Yes | min 10 chars |

**Goal type options and dynamic quantification placeholder:**

| Goal type | Placeholder |
|---|---|
| Raise investment | How much, by when, and from whom? e.g. £500k seed in 6 months from a deep tech VC |
| Acquire first paying customers | How many, of what type, paying what? e.g. 10 paying schools at £2k/year |
| Secure strategic partnership | With whom, for what outcome? e.g. NHS trust pilot leading to procurement |
| Win grant funding | Which grant, what amount? e.g. Innovate UK Smart Grant £400k |
| Achieve regulatory milestone | Which milestone? e.g. CE mark, FDA 510(k) clearance |
| Prepare for acquisition / exit | What terms, what timeline? e.g. Trade sale to NHS digital partner within 24 months |
| Other | Describe your goal in specific, measurable terms. |

### 6.3 Investor Stress Test (5 questions)

| Q# | Question | Sub-prompt |
|---|---|---|
| Q1 | What problem does the world have *today* that your research solves? | Describe it without any technical terms. If you can't explain it to your mum, it's not clear enough. |
| Q2 | Who is the first person or organisation that would pay for this? | And why would they pay *now*, before you have full proof? |
| Q3 | What's the one piece of evidence you have that this works? | And what would a sceptic say is wrong with it? |
| Q4 | Who else is trying to solve this problem? | And what do you have that they don't? |
| Q5 | What does success look like in 18 months? | And what's the single biggest thing that could prevent it? |

All five are required. Min 5 chars each.

---

## 7. API Endpoints

### `GET /`
Serves `static/index.html`.

---

### `POST /first-pass`

**Purpose:** Takes initial form inputs, calls Claude to generate adaptive follow-up questions. Creates a session and a DB row.

**Request body (`FirstPassRequest`):**
```json
{
  "project_name": "string (optional, max 256, default 'Untitled')",
  "research_area": "string (min 10)",
  "stage_value": 1,
  "stage_label": "Pre-seed (idea)",
  "goal_type": "Raise investment",
  "goal_quantification": "string (min 5)",
  "goal_rationale": "string (min 10)",
  "team_size": 3,
  "q1_answer": "string (min 5)",
  "q2_answer": "string (min 5)",
  "q3_answer": "string (min 5)",
  "q4_answer": "string (min 5)",
  "q5_answer": "string (min 5)"
}
```

**Response:**
```json
{
  "session_id": "uuid4-string",
  "analysis_id": 42,
  "follow_up_questions": [
    {
      "question": "Specific question grounded in the inputs",
      "why_asked": "One sentence on what this affects in the analysis"
    }
  ]
}
```

3–5 questions. Session stored in-memory with 30-minute TTL.

**Side effects:**
- `preliminary_assessment` from Claude stored in session (never shown to user, passed to second pass)
- `Analysis` DB row created with `status="pending"`, all form inputs, follow-up questions, and `preliminary_assessment` stored

---

### `POST /final-analysis`

**Purpose:** Takes follow-up answers, combines with session state, calls Claude for full gap analysis.

**Request body (`FinalAnalysisRequest`):**
```json
{
  "session_id": "uuid4-string",
  "follow_up_answers": [
    {
      "question": "The question text (echoed from first-pass response)",
      "answer": "User's answer"
    }
  ]
}
```

**Response:** Full analysis object plus `analysis_id` — see Section 9 for complete schema. The `analysis_id` integer is appended at the top level:
```json
{
  "analysis_id": 42,
  "plain_english_summary": "...",
  ...
}
```

**Side effects:**
- Session deleted after successful call (one-use)
- DB row updated: `follow_up_answers`, `analysis_result`, `completed_at`, `status="complete"`

**Error:** 404 if session not found or expired.

---

### `POST /download-pdf`

**Purpose:** Generates and streams a PDF for a given analysis result.

**Request body (`PdfRequest`):**
```json
{
  "analysis": { /* full analysis object from /final-analysis */ },
  "project_name": "string"
}
```

**Response:** `application/pdf` binary, `Content-Disposition: attachment; filename="<safe-name>.pdf"`.

---

### `GET /analyses`

**Purpose:** Lists all completed analyses for the sidebar history panel.

**Response:**
```json
[
  {
    "id": 42,
    "project_name": "OrganGuard",
    "created_at": "2026-05-03T14:30:00",
    "stage_label": "Validation Stage",
    "total_score": 28
  }
]
```

Ordered by `created_at` descending. Only rows with `status="complete"` are returned.

---

### `GET /analyses/{id}`

**Purpose:** Loads a specific analysis for re-display in the dashboard.

**Response:**
```json
{
  "id": 42,
  "project_name": "OrganGuard",
  "created_at": "2026-05-03T14:30:00",
  "inputs": {
    "project_name": "OrganGuard",
    "research_area": "...",
    "stage_value": 2,
    "stage_label": "Pre-seed (prototype)",
    "goal_type": "Raise investment",
    "goal_quantification": "...",
    "goal_rationale": "...",
    "team_size": 3,
    "q1_answer": "...",
    "q2_answer": "...",
    "q3_answer": "...",
    "q4_answer": "...",
    "q5_answer": "..."
  },
  "follow_up_questions": [ { "question": "...", "why_asked": "..." } ],
  "follow_up_answers":   [ { "question": "...", "answer": "..." } ],
  "result": { /* full analysis object */ }
}
```

**Error:** 404 if not found.

---

### `PATCH /analyses/{id}/name`

**Purpose:** Renames a saved analysis (triggered by "Rename" button in header).

**Request body:**
```json
{ "name": "New project name" }
```

**Response:** `{ "ok": true }`

---

### `DELETE /analyses/{id}`

**Purpose:** Permanently deletes a saved analysis from the DB.

**Response:** `{ "ok": true }`

---

## 8. Session Management

In-progress sessions are held in memory for the duration of a two-pass analysis cycle.

- Storage: Python dict `_sessions` in process memory
- Key: UUID4 string
- Value: `{ analysis_id, user_inputs_block, preliminary_assessment, created_at }`
- TTL: 30 minutes (`_SESSION_TTL = 1800`)
- Cleanup: Called at the start of every `/first-pass` and `/final-analysis` request
- **Sessions are not persisted.** Server restart clears all in-progress sessions. Any analysis that completed before the restart is already written to the DB.

---

## 8a. Database / Persistence

- **ORM:** SQLAlchemy (declarative), defined in `database.py` and `models.py`
- **Local default:** SQLite file `lab2launch.db` in the working directory, created automatically on startup
- **Postgres migration:** Set `DATABASE_URL=postgresql://user:pass@host/db` — no code changes needed. SQLAlchemy's `JSON`, `Text`, `DateTime`, and `Integer` column types map correctly to both engines.
- **Table:** `analyses` — one row per submitted analysis

**`analyses` table columns:**

| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK | Auto-increment |
| `created_at` | DateTime | Set on insert |
| `completed_at` | DateTime (nullable) | Set when final analysis completes |
| `project_name` | String(256) | From form input |
| `status` | String(32) | `"pending"` → `"complete"` |
| `research_area` | Text | |
| `stage_value` | Integer | 1–6 |
| `stage_label` | String(128) | VC label |
| `goal_type` | String(128) | |
| `goal_quantification` | Text | |
| `goal_rationale` | Text | |
| `team_size` | Integer | |
| `q1_answer` … `q5_answer` | Text | |
| `follow_up_questions` | JSON | `[{question, why_asked}]` |
| `preliminary_assessment` | Text | Claude's internal first-pass note |
| `follow_up_answers` | JSON | `[{question, answer}]` — populated on final analysis |
| `analysis_result` | JSON | Full Claude output object |

Rows with `status="pending"` are analyses where the server restarted between the two passes (orphaned). They are never returned by `GET /analyses`.

---

## 9. LLM Architecture

### 9.1 Models

```python
_MODEL_FIRST_PASS = "claude-haiku-4-5-20251001"   # fast, cheap
_MODEL_FINAL      = "claude-haiku-4-5-20251001"    # switch to claude-sonnet-4-6 for demo
```

### 9.2 First Pass — `FIRST_PASS_PROMPT`

**Input:** `user_inputs_block` (formatted text of all form fields)

**Instruction summary:**
- Do NOT produce the gap analysis yet
- Identify 3–5 places where inputs are ambiguous, inconsistent, or missing critical context
- Questions must be specific and grounded in what the founder said
- Researcher-friendly language, no jargon
- High-value themes: legal structure/funding model, buyer vs end-user, budget authority, regulatory awareness, undersold assets, internal contradictions, wedge clarity

**Output JSON:**
```json
{
  "follow_up_questions": [
    {
      "question": "string",
      "why_asked": "string"
    }
  ],
  "preliminary_assessment": "2-3 sentence internal note (not shown to user)"
}
```

### 9.3 Final Analysis — `FINAL_ANALYSIS_PROMPT`

**Inputs:**
- `user_inputs_block` — original form data
- `follow_up_block` — Q&A pairs from follow-up screen
- `preliminary_assessment` — Claude's own pass-1 note
- `sector_risk_block` — injected conditional risk instructions

**Structure (four steps in the prompt):**

**Step 1 — Assets Inventory:** 3–5 specific, grounded strategic assets before any gap analysis. Rules: must be grounded in inputs, no generic phrases like "strong team."

**Step 2 — Gap Analysis on 5 Dimensions, scored /10:**
Scoring anchors:
- 1–2: Not started
- 3–4: Started but weak
- 5–6: Halfway
- 7–8: Strong
- 9–10: Investor-ready

Calibration: score 4–5 across all = 12–18 months from PMF; score 7+ = 3–6 months.

Dimensions:
1. **Problem Clarity** — economic/safety driver vs feature gap; buyer pain quantified
2. **Market Evidence** — customer discovery, WTP validated, market size grounded
3. **Competitive Position** — genuine differentiation, not feature comparison
4. **Team & Execution** — right skills, commercial AND technical, advisors, governance
5. **Risk Awareness** — sector-specific risks named AND mitigated

**Sector risk block (conditional, injected into Step 2):**
Applied only when relevant to inputs:
- Health/medical/clinical: clinical liability, CE/FDA/MHRA, reimbursement model
- Minors/vulnerable adults: DBS, safeguarding frameworks, parental consent
- Personal/health data: GDPR special category, DPIA, data residency
- Dual-use: responsible disclosure, ITAR/EAR, ethical review
- Hardware/wet lab: manufacturing scale-up, supply chain, capital intensity

Scoring rule: A founder who hasn't named sector-relevant risks scores 1–3 regardless of generic risk awareness.

**Readability rules (enforced in prompt):**
- now/target/gap are arrays of 1–3 bullets, each max 18 words, no semicolons
- One idea per bullet; examples get their own bullet prefixed "e.g."

**Framework tagging rules:**
- Each dimension: 1–2 tags from a fixed list
- Allowed tags: `POPIT — People`, `POPIT — Organisation`, `POPIT — Process`, `POPIT — Information`, `POPIT — Technology`, `SWOT — Strength`, `SWOT — Weakness`, `SWOT — Opportunity`, `SWOT — Threat`, `Stakeholder Analysis`, `Business Case`
- Tags must differ across dimensions

**Step 3 — Top 3 Sequenced Actions:**
Sequenced by dependency: customer discovery before competitive mapping before hiring.
Each must have: specific deliverable, time-bound, startable tomorrow.

**Step 4 — Plain English Summary:**
2–3 sentences, zero jargon. Test: would a school governor understand it?

### 9.4 JSON Parsing

`_parse_json()` handles Claude responses that:
- Start with triple-backtick fences (strips them)
- Have trailing text after the closing brace (uses `json.JSONDecoder().raw_decode()`)

---

## 10. Analysis Output Schema

Complete JSON returned by `/final-analysis`:

```json
{
  "plain_english_summary": "string",

  "assets": [
    {
      "asset": "string — specific asset name",
      "why_it_matters": "string — one sentence competitive value"
    }
  ],

  "dimensions": {
    "problem_clarity": {
      "score": 7,
      "justification": "string — one sentence",
      "now": ["string", "string"],
      "target": ["string", "string"],
      "gap": ["string", "string"],
      "priority": "High|Medium|Low",
      "action": "string — specific, testable, time-bound",
      "framework_tags": ["POPIT — Information", "SWOT — Weakness"]
    },
    "market_evidence":      { /* same shape */ },
    "competitive_position": { /* same shape */ },
    "team_execution":       { /* same shape */ },
    "risk_awareness":       { /* same shape */ }
  },

  "total_score": 29,
  "stage_label": "Early Stage|Validation Stage|Growth Stage|Investor Ready",

  "top_3_actions": [
    {
      "rank": 1,
      "headline": "string — max 8 words",
      "deliverable": "string — what gets produced",
      "timeline": "Within X weeks",
      "first_step": "string — what to do this week",
      "rationale": "string — why first"
    }
  ]
}
```

**Stage label thresholds (total_score out of 50):**
- 0–15: Early Stage
- 16–25: Validation Stage
- 26–35: Growth Stage
- 36–50: Investor Ready

---

## 11. Frontend — Rendering Details

### 11.1 Dashboard Score Display
- Large number: `total_score`
- "out of 50"
- Stage label below in accent colour

### 11.2 Assets Section
- Appears before dimension cards and radar
- Each asset: green ✓ icon + bold asset name + muted why-it-matters text
- If no assets: honest message displayed

### 11.3 Radar Chart
- 5 axes: problem_clarity, market_evidence, competitive_position, team_execution, risk_awareness
- Scale: /10 (10 grid rings)
- Dots coloured by priority (red=High, amber=Medium, green=Low)
- Built as inline SVG, redraws on load

### 11.4 Top 3 Actions (cards)
Each card:
- Left border coloured by rank (accent purple / teal / green)
- Rank circle (filled, same colour)
- Bold headline
- 2-column grid: Deliverable | Timeline
- Full-width teal "FIRST STEP THIS WEEK" row (highlighted)

### 11.5 Dimension Cards
Each card:
- Label + score (X/10) right-aligned, coloured by priority
- Framework tag pills (muted purple background, hover tooltip)
- 10-segment progress bar (coloured by priority)
- NOW / TARGET / GAP as bullet `<ul>` lists (1–3 bullets each)
- Priority badge + action text at bottom

### 11.6 Framework Tag Tooltips

| Tag | Tooltip |
|---|---|
| POPIT — People | Skills, team composition, advisors, leadership capacity |
| POPIT — Organisation | Legal structure, governance, partnerships, incentives |
| POPIT — Process | Go-to-market, sales motion, delivery workflows |
| POPIT — Information | Market data, customer insights, competitive intelligence |
| POPIT — Technology | TRL level, IP, technical differentiation |
| SWOT — Strength | Internal advantage the founder already has |
| SWOT — Weakness | Internal gap or deficit that needs addressing |
| SWOT — Opportunity | External trend or untapped angle to exploit |
| SWOT — Threat | External risk, competitor move, or market shift |
| Stakeholder Analysis | Mapping buyers, users, influencers, and blockers |
| Business Case | Cost, benefit, feasibility, and risk assessment |

### 11.7 Methodology Footer
Collapsed by default. "How was this built?" link expands it. Static content — no LLM call.

Reveals:
- POPIT model description
- SWOT description
- Stakeholder Analysis description
- Business Case Structure description
- Scoring calibration anchors
- "Generated by Lab2Launch v1.1 using Claude (Anthropic)."

### 11.8 Persistence

**Draft autosave (localStorage):**
- Key: `l2l-draft`
- Saved every 5 seconds and on field blur
- Cleared when final analysis completes
- Used to restore in-progress form state after page reload

**Completed analyses (server DB):**
- Saved automatically when `POST /final-analysis` succeeds — no manual save action required
- Sidebar (`GET /analyses`) fetches from the server on every open
- Load a past analysis: `GET /analyses/{id}` — repopulates the form and renders the dashboard
- "Rename" button in the header (`PATCH /analyses/{id}/name`) updates the project name in the DB
- Delete from sidebar: `DELETE /analyses/{id}`
- The loaded analysis must have `result.dimensions` to render the dashboard view

---

## 12. PDF Generation

**Library:** fpdf2 (pure Python — no system library dependencies)

**Output:** A4 portrait, 18mm margins, auto page-break at 20mm from bottom.

**Sections in order:**
1. Header: "LAB2LAUNCH REPORT" label (accent), project name (H1), plain English summary, total score + stage label
2. **Your Assets** — green check + bold name + muted description
3. **Top 3 Actions** — left colour bar + rank circle + headline + deliverable/timeline grid + "FIRST STEP THIS WEEK" row
4. **Where You Are vs. Where You Need to Be** — one block per dimension: colour bar, label, score, framework pills, 10-segment bars, NOW/TARGET/GAP bullets, priority badge + action
5. **How This Report Was Built** — methodology text, scoring anchors, "Generated by Lab2Launch v1.1 using Claude (Anthropic)."

**Colour palette:**
- Accent (purple): `(124, 92, 255)`
- Turq: `(6, 182, 212)`
- Green: `(16, 185, 129)`
- Amber: `(245, 158, 11)`
- Red: `(239, 68, 68)`

**Character encoding:** Latin-1 with `errors="replace"` (em dashes, smart quotes become `?` — acceptable for this use case).

---

## 13. Not Implemented (Explicit Out of Scope)

These were documented in the v1.1 requirements but not built:

**P1 (deferred):**
- Website URL input field with prompt-injection-safe fetch
- Legal structure + funding model fields with conditional analysis
- SWOT output appendix (2×2 grid at end of report)

**P2 (next session):**
- Full overhaul of 5 stress test questions to 10 directed prose questions
- Multiple-choice expansion for categorical fields
- Visual asset map in PDF (radar chart for assets vs gaps)
- Comparison to "comparable spinouts at this stage"
- Multi-language support
- Authentication / per-user isolation (analyses are currently shared across all local sessions)

---

## 14. Known Limitations

1. **In-progress sessions are lost on server restart.** Any analysis mid-flow (between first pass and final analysis) will 404 if the server restarts. Completed analyses are persisted to SQLite and survive restarts.

2. **Single-user assumption.** No auth, no user isolation. All users share the same process and session dict.

3. **PDF character encoding.** The fpdf2 generator uses Latin-1. Characters outside that range (e.g. smart quotes `'`, em dashes `—`) are replaced with `?`. Fix: register a Unicode-compatible font (e.g. DejaVu) or use fpdf2's core font with UTF-8 mode.

4. **LLM non-determinism.** Two submissions of identical inputs will produce different follow-up questions and may produce slightly different analysis. This is expected and desirable.

5. **Model cost.** Both passes currently use `claude-haiku-4-5-20251001`. Switch `_MODEL_FINAL` in `prompts.py` to `claude-sonnet-4-6` for demo quality. First pass on haiku is intentional (cheaper, faster for question generation).

6. **No rate limiting.** The API endpoints call Claude on every request without debounce or quota enforcement.

7. **Session TTL not background-enforced.** Expired sessions are only cleaned up at the start of the next `/first-pass` or `/final-analysis` request. Long-idle servers accumulate stale sessions in memory.

---

## 15. Scoring Reference

### Score Anchors (per dimension, /10)

| Score | Meaning |
|---|---|
| 1–2 | Not started. No evidence, no work done. |
| 3–4 | Started but weak. Some thought, no validation or structure. |
| 5–6 | Halfway. Real work done but key gaps remain. |
| 7–8 | Strong. Most elements in place, refinement needed. |
| 9–10 | Investor-ready. Fully validated, defensible, evidence-backed. |

### Stage Labels (total score /50)

| Range | Label |
|---|---|
| 0–15 | Early Stage |
| 16–25 | Validation Stage |
| 26–35 | Growth Stage |
| 36–50 | Investor Ready |

### Calibration Anchors (built into prompt)
- Score 4–5 across all dimensions → ~12–18 months from PMF
- Score 7+ across all dimensions → ~3–6 months from PMF

---

## 16. BA Frameworks Applied

The methodology footer and PDF both name these. They run inside the Claude prompts — the user never inputs against them.

| Framework | Application in Lab2Launch |
|---|---|
| **POPIT model** | Maps each of the 5 analysis dimensions to People, Organisation, Process, Information, or Technology lens. Each dimension gets 1–2 POPIT tags in the output. |
| **SWOT** | Used in framework tagging to identify genuine Strengths (assets), Weaknesses (gaps), Opportunities (untapped angles), Threats (external risks). The assets inventory maps to SWOT Strengths. |
| **Stakeholder Analysis** | Applied in Market Evidence and Problem Clarity when findings are about buyer/user/influencer/blocker mapping. Tagged explicitly in output. |
| **Business Case Structure** | Applied in Risk Awareness and Team & Execution when findings concern cost, benefit, feasibility or resource allocation. |
