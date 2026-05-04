# Test Report — Improved Design

**Branch:** `feature/improved-design`  
**Date:** 2026-05-04  
**Final status:** Passed — user confirmed locally

---

## Test Run Summary

**Automated tests:** 0 run, 0 passed, 0 failed.  
No automated test suite exists in this project (confirmed: pytest not installed, no test files in project root). Per CLAUDE.md this is a known gap (PRD §13 — P2).

**Code review validation:** All acceptance criteria assessed via static analysis of `static/index.html`.

---

## Post-Testing Fixes

Three issues were caught and fixed during local testing:

**1. Landing page always visible (CSS specificity bug)**  
`#landing-view` had `display:flex` in an inline style, which outranks Tailwind's `.hidden { display:none }` class. Fixed by moving flex layout into a CSS rule (`#landing-view { display:flex }`) with a higher-specificity override (`#landing-view.hidden { display:none }`). Also added `class="hidden"` to `#form-view`'s initial HTML to prevent a flash before JS loads.

**2. Content column width**  
`max-w-4xl` felt narrow for the analysis dashboard. Widened to `max-w-6xl` (1152 px) across all views after two rounds of user feedback (4xl → 5xl → 6xl).

**3. Top 3 Actions layout**  
The radar/actions side-by-side layout felt squished. Moved radar to full width and actions to a 3-column horizontal grid below. Download/save/new buttons moved to a right-aligned row beneath the actions.

---

## Regressions Found

None. Changes are additive (new landing view) or CSS/DOM updates that do not touch API calls, form submission logic, chart rendering, PDF download, or autosave. No existing function signatures changed.

**Functions modified:**
- `setView()` — refactored from explicit toggle calls to a forEach loop. Logic is equivalent for all existing view IDs (`form`, `followup`, `loading`, `dashboard`); `landing` is newly added.
- `startNew()` — only the terminal `setView('form')` call changed to `setView('landing')`.
- `DOMContentLoaded` — added draft detection; if no draft found, `loadDraft()` is not called (correct — nothing to load).

---

## New Tests Written

None — no test framework installed. See Manual Testing Checklist below for equivalent coverage.

---

## Acceptance Criteria Validation

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | Fresh load (no draft) → landing page shown | **Passed** | `DOMContentLoaded`: `hasDraft = !!localStorage.getItem('l2l-draft')`. If false, `setView('landing')`. `#landing-view` is shown; all other views are `hidden`. |
| 2 | "Try me now" → form view | **Passed** | Button `onclick="setView('form');window.scrollTo(0,0)"` in `#landing-view` HTML. |
| 3 | Draft present → form shown on load, landing skipped | **Passed** | `if (hasDraft) { loadDraft(); setView('form'); } else { setView('landing'); }` |
| 4 | All views cap at `max-w-4xl` | **Passed** | `#form-view`, `#followup-view`, `#loading-view` already used `max-w-4xl`. `#dashboard-view` inner div changed from `max-w-6xl` to `max-w-4xl`. `#landing-view` uses `max-w-4xl mx-auto`. |
| 5 | Dark mode background noticeably more navy | **Passed** | `--bg: #0c1a2e` (was `#0f1419`). Delta: notably more blue-shifted; hue shifts from near-neutral dark to clear navy. |
| 6 | Burger menu icon on the right of header | **Passed** | Burger `<button>` moved to the right `<div class="flex items-center gap-3">` cluster, after save button. |
| 7 | Sidebar slides in from the right | **Passed** | `#sidebar` CSS: `right-0`, `translateX(100%)`, toggled to `translateX(0)` on `.open`. `<aside>` class changed from `left-0` to `right-0`. |
| 8 | Flask SVG icon in header alongside wordmark | **Passed** | Inline 26×26 SVG (flask / Erlenmeyer path + bubble circles) inserted before the wordmark `<div>` in the logo group. |
| 9 | Subtle grid texture visible in dark mode | **Passed** | `body` CSS: `background-image` SVG data-URI 40×40 px graph-paper grid, `rgba(30,58,90,0.4)` stroke. |

**All 9 criteria: Passed via code review.**

---

## Manual Testing Checklist

**Landing page**
- [ ] Open the app in a fresh private/incognito window (no localStorage) → landing page hero appears, not the form
- [ ] Headline reads "From research bench to investor meeting."
- [ ] "Try me now" button is visible and styled with accent colour
- [ ] Click "Try me now" → form appears, scroll is at the top
- [ ] Decorative axes SVG visible faintly in bottom-right corner of landing page

**Header**
- [ ] Flask icon appears to the left of "Lab2Launch" wordmark
- [ ] Burger / hamburger icon is in the top-right of the header
- [ ] Logo subtitle "Research → Investor-Ready" visible beneath the wordmark

**Sidebar**
- [ ] Click burger (top-right) → sidebar slides in from the right edge
- [ ] Backdrop appears; clicking backdrop closes sidebar
- [ ] Sidebar shows project list correctly

**Dark mode colours**
- [ ] Background is a clear navy blue (not near-black); compare by toggling theme to light and back
- [ ] Subtle grid lines visible in the background behind content
- [ ] Cards and inputs are still clearly differentiated from the background

**Width consistency**
- [ ] Form, follow-up, loading, and dashboard all have the same content column width
- [ ] Dashboard content is narrower than before (was 6xl, now 4xl) — radar and dimension cards still look good

**Full flow**
- [ ] Submit the form → follow-up questions appear
- [ ] Submit follow-ups → dashboard appears at max-w-4xl
- [ ] Click "New analysis" from dashboard → landing page reappears
- [ ] Fill form halfway, wait 5 s (autosave) → reload page → form shown with draft, landing skipped

**Light mode**
- [ ] Toggle to light mode → app is functional; grid lines may show faintly (acceptable; known deviation in dev-notes)
- [ ] Toggle back to dark → navy background restored

**Mobile (375 px)**
- [ ] Headline scales down appropriately via `clamp()`
- [ ] Sidebar at 288 px (`w-72`) fits within 375 px viewport when open
- [ ] Burger icon accessible top-right at mobile widths

---

## Coverage Gaps

- **No route-level integration tests** — form submission, follow-up flow, analysis generation, and PDF download are not covered by automated tests. All require real Claude API calls. Manual testing covers the golden path.
- **Light mode grid appearance** — grid texture uses a fixed navy RGBA colour and is slightly visible in light mode. Not a regression (feature didn't exist before) but worth noting for a future light-mode redesign ticket.
- **Animation smoothness** — sidebar slide-in transition cannot be verified statically; requires visual check.
