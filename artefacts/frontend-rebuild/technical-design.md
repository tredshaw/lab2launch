# Technical Design — Lab2Launch Frontend Rebuild

**Ticket:** Frontend Rebuild: FastAPI + React (Vite) — landing + form  
**Version:** 2.0  
**Date:** 2026-05-08  
**Status:** Approved

---

## Scope

### In scope
- Migrate frontend from single-file `static/index.html` (vanilla JS + Tailwind CDN) to React 18 + Vite 5 + TypeScript
- Implement locked v0.3 design system (tokens.css, Instrument Serif + Inter Tight + JetBrains Mono)
- Landing page: all 8 sections (Hero, Marquee, Problem, ThreeActs, AnatomyOfGap, LiveReport, POPIT, Who, CTA)
- Analysis form: 8-step wizard (Setup + 5 Act D questions + Follow-up + Running)
- Two-pass backend integration: first-pass → follow-up questions on screen → final analysis
- Reorganise backend files into `backend/` subdirectory
- CORS update to allow `localhost:5173`
- Three interactive moments: ticker, radar scroll-fill, live report scrollytell
- Responsive layout: 900px breakpoint

### Out of scope
- Results/dashboard display (old `static/index.html` remains accessible at `/old` for reference)
- Auth, accounts, history, payment, email
- PDF generation changes
- Gemini LLM integration (keep Claude haiku)
- Dark mode toggle on landing page
- Storybook, SSR, multi-tenant

---

## Technical Approach

### Frontend architecture
React 18 + Vite 5 + TypeScript (strict). React Router 6 with two routes: `/` (Landing) and `/analyse` (Form). Vanilla CSS via CSS custom properties only — no Tailwind, no CSS-in-JS. Design tokens in one file (`tokens/tokens.css`); all components import tokens via var() references.

**Three-layer separation:**
1. `tokens/tokens.css` — all design decisions (colour, type, spacing)
2. `content/landing.ts`, `content/form.ts` — all user-facing copy
3. `components/`, `sections/`, `pages/` — layout only, no hardcoded copy or colour

### Interactive mechanics
- **Ticker:** CSS `@keyframes` translate(-50%) infinite loop. Items duplicated inside component for seamless looping. `animation-play-state: paused` on hover. `--ticker-speed` custom property from prop.
- **Radar scroll-fill:** `useScrollFill.ts` hook, IntersectionObserver threshold 0.3. Adds `.in-view` to SVG container → polygon opacity 0→1 + scale 0.3→1.0 (1s). Fallback 1500ms timer.
- **Live report scrollytell:** Four stage elements observed with `rootMargin: '-15% 0px -35% 0px'`. Right panel sticky via `position: sticky; top: 100px`. Stage activation reveals corresponding block. Top-3 actions stagger 200ms.

### Backend proxy
Vite `server.proxy` forwards `/first-pass`, `/final-analysis`, `/download-pdf`, `/analyses` to `localhost:8000`. No environment variable needed in dev — just run both servers.

---

## Data Model Changes

None. Backend data model (`Analysis` table) is unchanged. The new frontend sends the same request shapes to the same endpoints.

---

## API / Interface Changes

### CORS update (`backend/main.py`)
Add `http://localhost:5173` to `allow_origins`.

### Endpoint mapping (unchanged contracts)
| Endpoint | Used by |
|---|---|
| `POST /first-pass` | Form step 06 (after wizard submit) |
| `POST /final-analysis` | Follow-up step (after Claude questions answered) |
| `POST /download-pdf` | Out of scope for v1 landing |
| `GET /` | Now serves `backend/static/index.html` (old frontend, fallback) |

### Backend directory move
All Python files move to `backend/`. `start.sh` updated: `exec venv/bin/uvicorn main:app --reload` → runs from `backend/` directory. Static files move to `backend/static/`.

---

## Integration Points

- `useWizard.ts` manages form state across all 8 steps; exposes `formData`, `step`, `next()`, `prev()`, `submitFirstPass()`, `submitFinalAnalysis()`
- `Form.tsx` orchestrates wizard steps and API calls; uses `fetch('/first-pass', ...)` (proxied by Vite)
- `RadarChart.tsx` uses `useScrollFill.ts` hook for scroll-triggered animation
- `LiveReport.tsx` uses its own internal IntersectionObserver (not `useScrollFill`) for the per-stage trigger with custom rootMargin

---

## Acceptance Criteria

| # | Criterion | Test method |
|---|---|---|
| AC1 | `tokens.css` is the only file containing hex colours | `grep -r '#[0-9A-Fa-f]\{3,6\}' frontend/src --include='*.tsx' --include='*.ts'` → zero results |
| AC2 | Every section is a separate `.tsx` file ≤ 60 lines | `wc -l frontend/src/sections/*.tsx` |
| AC3 | All copy in `content/landing.ts` or `content/form.ts` | Manual review — no string literals in components |
| AC4 | Reordering SECTIONS array works | Set order [cta, hero, problem] → page renders in that order |
| AC5 | `enabled: false` removes section silently | Toggle any section off → no errors |
| AC6 | Three interactive moments work at 1280×800 | Browser manual check: Chrome, Safari, Firefox |
| AC7 | Responsive: no horizontal scroll at 960px, legible at 480px | Browser DevTools device simulation |
| AC8 | Form POSTs to `/first-pass` and renders follow-up questions | Complete form → Claude questions appear |
| AC9 | `npm run build` bundle ≤ 200KB gzipped | `du -sh dist/assets/*.js` |
| AC10 | Backend starts cleanly from `backend/` | `cd backend && ./start.sh` |

---

## Technical Risks

1. **Bundle size:** RadarChart (SVG) + LiveReport (complex DOM) could push bundle over 200KB. Mitigation: no heavy dependencies; all animation is CSS.
2. **Scroll observer reliability:** IntersectionObserver doesn't fire in some headless environments. Mitigation: 1500ms fallback timer in `useScrollFill`.
3. **Vite proxy and CORS:** Both must be configured or forms will 404 in dev. Mitigation: test proxy in M0 before any form work.
4. **Import paths after backend move:** All relative imports inside Python files work without change. Only `start.sh` and `CLAUDE.md` need updating.

---

## Deferred / Out of Scope

- Results display page (v2 ticket)
- PDF styling improvements (v2 ticket)
- Notion backlog update (no ticket exists for this work — PRD was provided directly)
