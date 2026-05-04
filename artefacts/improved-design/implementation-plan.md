# Implementation Plan — Improved Design

**Input:** `technical-design.md`  
**Branch:** `feature/improved-design`  
**Worktree:** `../worktrees/improved-design`

---

## Setup

Only `static/index.html` is modified. No dependencies to install. Working in the `feature/improved-design` worktree.

---

## Tasks

### Task 1: Update dark mode CSS colour variables

- **What:** Change `:root` variables `--bg`, `--card`, `--inp`, `--border`, `--grid`, `--grid2` to lighter navy values
- **Files:** `static/index.html` — `:root` block (~lines 10–28)
- **Done when:** Page background reads as navy blue, not near-black

### Task 2: Add retro scientific grid texture to body

- **What:** Add `background-image` SVG data-URI grid to the `body` CSS rule
- **Files:** `static/index.html` — `body` rule (~lines 48–55)
- **Done when:** Subtle 40 px graph-paper grid is visible in dark mode behind content

### Task 3: Move sidebar to right side

- **What:** Change `#sidebar` CSS from `left-0` to `right-0`, flip transform direction, change `border-right` to `border-left`
- **Files:** `static/index.html` — `#sidebar` CSS block (~lines 153–161) and sidebar `<aside>` element (~line 367)
- **Done when:** Sidebar slides in from the right when triggered

### Task 4: Update header — logo left, burger right

- **What:** Remove burger button from left cluster; update left cluster to logo only (with new SVG icon). Add burger button to right cluster alongside theme toggle and save button.
- **Files:** `static/index.html` — `<header>` block (~lines 382–404)
- **Done when:** Logo is on the left with flask icon; burger is on the right of the header

### Task 5: Upgrade logo with SVG flask icon

- **What:** Insert inline SVG flask icon (24×24) before the "Lab2Launch" text in the logo group
- **Files:** `static/index.html` — logo `<div>` inside header (~lines 388–391)
- **Done when:** A flask/science icon appears to the left of "Lab2Launch" in the header

### Task 6: Add landing page HTML

- **What:** Insert `#landing-view` div before `#form-view`. Full-viewport hero with: eyebrow label, large headline, sub-copy paragraph, "Try me now →" CTA button, and a decorative SVG crosshair/axes element in the corner.
- **Files:** `static/index.html` — before `<!-- Form View -->` comment (~line 406)
- **Done when:** Landing page HTML exists with correct structure and CTA wired to `setView('form')`

### Task 7: Update setView() to handle 'landing'

- **What:** Extend `setView(v)` to include `'landing'` in the view toggle logic. Also hide `#progress-sticky` whenever the view is not `'form'`.
- **Files:** `static/index.html` — `setView()` function (~lines 940–946)
- **Done when:** `setView('landing')` shows landing, hides all others; progress bar hidden on non-form views

### Task 8: Update startNew() and DOMContentLoaded init

- **What:** 
  - `startNew()`: call `setView('landing')` instead of `setView('form')`
  - `DOMContentLoaded`: detect localStorage draft; if draft exists → `setView('form')`; else → `setView('landing')`
- **Files:** `static/index.html` — `startNew()` (~line 953) and `DOMContentLoaded` handler (~line 1390)
- **Done when:** Fresh load shows landing; draft load shows form; completing/discarding analysis returns to landing

### Task 9: Standardise dashboard max-width to max-w-4xl

- **What:** Change `max-w-6xl` to `max-w-4xl` in the dashboard view's inner container
- **Files:** `static/index.html` — `#dashboard-view` inner div (~line 643)
- **Done when:** Dashboard content width matches form/followup/loading views

---

## Test Strategy

**Unit tests:** None — no JS functions exposed for unit testing; changes are DOM/CSS.

**Integration tests:** None — no API changes.

**Manual testing checklist (for Tester agent and user):**

1. Clear localStorage, load page → landing page appears
2. Click "Try me now" → form view shown, header visible with burger on right
3. Fill and submit the form → follow-up view → generate analysis → dashboard at `max-w-4xl`
4. From dashboard, click "New analysis" → landing page reappears
5. Fill form, wait 5 s (autosave) → reload page → form shown with draft (landing skipped)
6. Click burger icon (top-right) → sidebar slides in from right
7. Check dark mode: background is navy, not near-black; grid texture visible
8. Toggle theme to light → app still functional, grid not distracting
9. Inspect header: flask icon left of "Lab2Launch" wordmark
10. All views (landing, form, followup, loading, dashboard) have consistent content width

---

## Riskiest Task

**Task 3 (sidebar right-side flip)** — the sidebar CSS, the backdrop, and the toggle JS all assume a left-anchored drawer. A missed CSS or class reference will break the open/close animation. Test at 375 px width.

**Task 7 (setView update)** — the `#progress-sticky` div is currently inside `#form-view` so it hides automatically. If it is ever moved outside, this will need explicit hiding. Verify the progress bar doesn't bleed into other views.
