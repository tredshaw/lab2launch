# Implementation Plan — Lab2Launch Frontend Rebuild

**Input:** technical-design.md  
**Branch:** `feature/frontend-rebuild`  
**Artefacts:** `artefacts/frontend-rebuild/`

---

## Setup

- Node.js 20+ required (`node --version`)
- Python venv at `backend/venv/` after move
- Both servers run concurrently: `cd backend && ./start.sh` (port 8000) + `cd frontend && npm run dev` (port 5173)
- Design tokens source: `/tmp/design_extract/lab2launch-design-system/project/tokens.css`
- Design components source: `/tmp/design_extract/lab2launch-design-system/project/components.jsx`

---

## Tasks

### Task 0: Reorganise backend
- **What:** Move all Python + config files from root into `backend/`. Update `start.sh` to run from `backend/`. Update CORS in `main.py`. Serve old `static/index.html` from `backend/static/`.
- **Files:** `backend/main.py`, `backend/prompts.py`, `backend/models.py`, `backend/database.py`, `backend/pdf_generator.py`, `backend/requirements.txt`, `backend/start.sh`, `backend/static/index.html`, `CLAUDE.md`
- **Done when:** `cd backend && ./start.sh` serves the app at port 8000 with no errors

### Task 1: Vite scaffold
- **What:** `npm create vite@latest frontend -- --template react-ts`. Install react-router-dom. Configure `vite.config.ts` with proxy to localhost:8000. Copy tokens.css verbatim. Set up Google Fonts in `index.html`.
- **Files:** `frontend/package.json`, `frontend/vite.config.ts`, `frontend/tsconfig.json`, `frontend/index.html`, `frontend/src/tokens/tokens.css`, `frontend/src/main.tsx`
- **Done when:** `npm run dev` starts with no errors; tokens.css variables accessible in browser devtools
- **Commit:** `feat: scaffold React/Vite frontend with design tokens`

### Task 2: Base components (M1)
- **What:** Port components.jsx to TypeScript. Add Button, SectionHead, Crumb components from PRD.
- **Files:** `frontend/src/components/Wordmark.tsx`, `SigmaSymbol.tsx`, `Tag.tsx`, `Button.tsx`, `TopNav.tsx`, `Footer.tsx`
- **Done when:** App.tsx renders Nav + Footer with Logo visible at localhost:5173
- **Commit:** `feat: foundational components from design system (M1)`

### Task 3: Content layer skeleton
- **What:** Create typed content files with all landing and form copy.
- **Files:** `frontend/src/content/landing.ts`, `frontend/src/content/form.ts`, `frontend/src/types/content.ts`
- **Done when:** TypeScript compiles without errors

### Task 4: Hero + Ticker (M2)
- **What:** Ticker with CSS animation, RadarChart SVG, useScrollFill hook, Hero section.
- **Files:** `frontend/src/hooks/useScrollFill.ts`, `frontend/src/components/Ticker.tsx`, `frontend/src/components/RadarChart.tsx`, `frontend/src/sections/Hero.tsx`, `frontend/src/pages/Landing.tsx`
- **Done when:** Hero visible at `/`; ticker scrolls; radar animates on scroll into view
- **Commit:** `feat: hero section and ticker with scroll-fill radar (M2)`

### Task 5: Mid sections (M3)
- **What:** Marquee, Problem, ActCard + ThreeActs, GapTable + AnatomyOfGap.
- **Files:** `frontend/src/components/Marquee.tsx`, `frontend/src/components/ActCard.tsx`, `frontend/src/components/GapTable.tsx`, `frontend/src/sections/Problem.tsx`, `frontend/src/sections/ThreeActs.tsx`, `frontend/src/sections/AnatomyOfGap.tsx`
- **Done when:** All three sections render correctly with sample data from landing.ts
- **Commit:** `feat: problem, three acts, anatomy of gap sections (M3)`

### Task 6: Live Report (M4)
- **What:** Left scroll narrative + right sticky card. Per-stage IntersectionObserver. Actions stagger.
- **Files:** `frontend/src/components/LiveReport.tsx`, `frontend/src/sections/LiveReportSection.tsx`
- **Done when:** Scrolling through stages activates blocks on right panel
- **Commit:** `feat: live report scrollytell component (M4)`

### Task 7: Remaining sections (M5)
- **What:** PopitGrid, WhoCard, PopitSection, WhoSection, CTA. Complete landing.ts copy. Verify SECTIONS toggle.
- **Files:** `frontend/src/components/PopitGrid.tsx`, `frontend/src/components/WhoCard.tsx`, `frontend/src/sections/PopitSection.tsx`, `frontend/src/sections/WhoSection.tsx`, `frontend/src/sections/CTA.tsx`
- **Done when:** Full landing page renders; `enabled: false` removes sections cleanly; 900px responsive
- **Commit:** `feat: popit, who, cta sections; landing page complete (M5)`

### Task 8: Form wizard (M6)
- **What:** useWizard hook, WizardStep component, all 8 steps from form.ts.
- **Files:** `frontend/src/hooks/useWizard.ts`, `frontend/src/components/WizardStep.tsx`, `frontend/src/pages/Form.tsx`, `frontend/src/content/form.ts` (complete)
- **Done when:** All 8 steps navigable; stage pill-selector and goal pill-selector work; validation prevents empty submit
- **Commit:** `feat: form wizard with all 8 steps (M6)`

### Task 9: Backend integration (M7)
- **What:** Wire form submit → POST /first-pass → follow-up question screen → POST /final-analysis → completion screen.
- **Files:** `frontend/src/pages/Form.tsx` (API calls added), `frontend/src/components/WizardStep.tsx` (follow-up variant)
- **Done when:** End-to-end flow completes; Claude follow-up questions appear on screen after first submit
- **Commit:** `feat: two-pass form to backend integration (M7)`

### Task 10: Polish + build (M8)
- **What:** Responsive fixes at 960/480. Favicon. README. npm run build passes under 200KB.
- **Files:** `frontend/public/favicon.svg`, `README.md`, responsive CSS in section files
- **Done when:** `npm run build` succeeds; gzipped bundle ≤ 200KB
- **Commit:** `feat: responsive polish and build verification (M8)`

---

## Test Strategy

**Automated (AC1, AC9):**
- `grep -r '#[0-9A-Fa-f]\{3,6\}' frontend/src --include='*.tsx'` → zero results
- `npm run build` completes; check gzip size

**Integration (AC8):**
- Complete form → `/first-pass` responds → follow-up questions render
- Answer follow-ups → `/final-analysis` responds → completion screen

**Manual (AC4–AC7):**
- Reorder SECTIONS array → page reorders
- Toggle `enabled: false` → section disappears silently
- Chrome DevTools: 960px no horizontal scroll; 480px legible
- Three interactive moments: ticker, radar, live report

---

## Riskiest Task

**Task 6 (Live Report scrollytell).** The dual-column sticky layout with IntersectionObserver requires careful CSS — `position: sticky` interacts badly with `overflow: hidden` ancestors. The rootMargin values need tuning for the trigger point to feel natural. Get the sticky/scroll structure right before adding visual polish.
