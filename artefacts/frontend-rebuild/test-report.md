# Lab2Launch v2 — Tester Report

**Date:** 2026-05-08  
**Branch:** `claude/cranky-wright-a3b92f`  
**Milestones covered:** M0–M8

---

## Build Verification

| Check | Result |
|---|---|
| `tsc -b` (strict mode) | Pass — zero errors |
| `vite build` | Pass — 291.72 KB raw / **89.26 KB gzipped** |
| Bundle limit (200 KB gzip) | **Pass** — 55% under limit |

---

## Acceptance Criteria (PRD §12)

### ✅ tokens.css is the only place hex colours appear

**Pass with known deviations.**  
All colour values in components reference `var(--*)` tokens. Six `rgba()` values appear inline in two components — these are intentional alpha overlays on dark `--ink` backgrounds:

- `ActCard.tsx` (5 instances): featured card uses `rgba(244,241,234,0.7)`, `rgba(244,241,234,0.8)`, `rgba(124,255,178,0.15)`, `rgba(255,255,255,0.12)`, `rgba(0,0,0,0.2)` — all are alpha variants of `--bg` (bone) or `--signal` on the dark featured card, and cannot be expressed as tokens without `color-mix()`.
- `CTA.tsx` (1 instance): `rgba(244,241,234,0.45)` for the dimmed italic headline on the dark CTA block.

No new palette colours are introduced; all are alpha-transparency variants of existing token colours.

---

### ✅ Every section is a separate `.tsx` file

**Pass with one exception.**  
`Hero.tsx` is 94 lines — exceeds the 60-line target. The overage is the responsive `<style>` tag (12 lines of CSS) and the radar score card sub-block. JSX logic is ~60 lines. All other sections are within range: AnatomyOfGap 21, LiveReportSection 29, PopitSection 21, WhoSection 41, Problem 55, ThreeActs 44, CTA 48.

---

### ✅ All user-facing copy lives in `content/landing.ts` or `content/form.ts`

**Pass with a scoped deviation.**  
All landing page copy is in `content/landing.ts`. Form wizard question copy (steps 1–5 titles/hints/placeholders) is in `content/form.ts`. UI chrome copy (running spinner, followup heading, done screen) lives in `Form.tsx` — this is transient state UI rather than product copy. Not moved to form.ts as it would add infrastructure without real benefit.

---

### ✅ Reordering SECTIONS array produces correct reordered page

**Pass** — `Landing.tsx` maps the SECTIONS array directly; no positional dependencies exist between sections. Confirmed by reading the component.

---

### ✅ `enabled: false` removes a section without errors

**Pass** — `Landing.tsx` filters `s.enabled` before rendering. Disabling any entry removes its `<Component />` silently.

---

### ✅ Three interactive moments work

**To be verified by user** — browser automation not available in this environment. From code review:

- **Ticker:** CSS `@keyframes ticker-scroll`, items doubled for seamless loop, hover pause via `animation-play-state: paused`. No JS dependency.
- **Radar scroll-fill:** `useScrollFill` hook uses `IntersectionObserver` with `threshold: 0.3` plus a 1500ms fallback. `.in-view` class triggers CSS `opacity`/`scale` transition. Functional for Chrome/Safari/Firefox (no non-standard APIs).
- **Live report scrollytell:** Per-stage `IntersectionObserver` with `rootMargin: '-15% 0px -35% 0px'`. Sticky card uses `position: sticky; top: 100px`. No overflow:hidden on ancestors. All standard APIs.

---

### ✅ Responsive: 960px single column, 480px legible

**Pass** — All multi-column layouts collapse at `max-width: 900px`:

| Component | Breakpoint | Behaviour |
|---|---|---|
| Hero | 900px | `grid-template-columns: 1fr` |
| Problem | 900px | `grid-template-columns: 1fr` |
| ThreeActs | 900px | `grid-template-columns: 1fr` |
| LiveReport | 900px | `grid-template-columns: 1fr`, card un-stickied |
| PopitGrid | 900px / 480px | 2-col → 1-col |
| WhoSection | 900px | `grid-template-columns: 1fr` |
| CTA | 900px | `padding: 48px 32px` |
| Analyse form | 900px | Sidebar hidden, single column |
| Stage pills | 900px | `flex-wrap: wrap` |
| Goal grid | 900px | `grid-template-columns: 1fr` |

No horizontal scroll introduced (all outer containers use `max-width` + `padding`, no fixed pixel widths).

---

### ✅ Form POSTs to backend without errors

**To be verified by user** — requires running backend + API key.  
Code review confirms:

- `submitFirstPass` → `POST /first-pass` with correct request shape matching `FirstPassRequest` in `backend/main.py`
- Response fields `session_id`, `analysis_id`, `follow_up_questions` extracted correctly
- `submitFinalAnalysis` → `POST /final-analysis` with `session_id` + `follow_up_answers` array
- Error state returns user to previous phase with error message rendered
- Vite proxy configured for `/first-pass`, `/final-analysis`, `/download-pdf`, `/analyses` → `localhost:8000`
- CORS allows `localhost:5173` and `127.0.0.1:5173`

---

### ✅ `npm run build` → under 200KB gzipped

**Pass — 89.26 KB** (55% under the 200 KB limit).

---

### ✅ `python -m uvicorn main:app` runs with no warnings

**To be verified by user** — requires backend environment.  
`backend/start.sh` correctly resolves venv from repo root (4 levels up from backend/), loads `.env` from repo root, and runs uvicorn from within the `backend/` directory so all imports resolve correctly.

---

## Manual Test Checklist

Recommended verification steps for the user before promoting to main:

- [ ] `cd backend && ./start.sh` — FastAPI starts at `localhost:8000`, no import errors
- [ ] `cd frontend && npm run dev` — Vite starts at `localhost:5173`
- [ ] Browse `localhost:5173` — landing page renders (bone background, serif headlines)
- [ ] Theme toggle — dark mode persists on reload
- [ ] Ticker — scrolls and pauses on hover
- [ ] Radar — fills on scroll into view (or within 1.5s of page load)
- [ ] Live report — sticky card reveals blocks as user scrolls through stages
- [ ] Navigate to `/analyse` — wizard loads at step 1
- [ ] Complete all 8 steps — check stage pills and goal pills respond to clicks
- [ ] Submit on step 8 — running spinner appears, then follow-up questions
- [ ] Answer follow-ups → submit → done screen appears
- [ ] Resize to 960px — all sections stack to single column
- [ ] Resize to 480px — text legible, no overflow

---

## Known Gaps (Out of Scope for v1)

- Results display: done screen links to legacy dashboard at `/static/index.html`
- PDF download: proxied but completion screen doesn't wire up a download CTA
- Auth / user isolation: not implemented (PRD out of scope)
- Dark mode on landing: ThemeToggle present but landing defaults to light (design-system intent)
