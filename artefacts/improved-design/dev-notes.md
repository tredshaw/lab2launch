# Dev Notes — Improved Design

## Branch

`feature/improved-design`  
Worktree: `../worktrees/improved-design`

---

## What Was Built

**Task 1 — Dark mode colour variables:** Updated `:root` CSS variables `--bg`, `--card`, `--inp`, `--border`, `--grid`, `--grid2` to a lighter navy palette. Background went from near-black `#0f1419` to a genuine navy `#0c1a2e`.

**Task 2 — Grid texture:** Added SVG data-URI `background-image` to `body` — a 40 px graph-paper grid at 0.4 opacity in a dark navy stroke. Visible in dark mode, effectively invisible in light mode.

**Task 3 — Sidebar to right side:** Changed `#sidebar` CSS: `left-0 → right-0`, `border-right → border-left`, `translateX(-100%) → translateX(100%)`.

**Task 4 & 5 — Header and logo:** Removed burger from left cluster. Added inline SVG flask icon to logo group (left). Moved burger button to the right cluster (after theme toggle and save button).

**Task 6 — Landing page:** Added `#landing-view` div before `#form-view`. Contains eyebrow label, large clamp-based headline, sub-copy, "Try me now →" CTA, and a fixed-position decorative SVG axes/graph element (8% opacity, bottom-right). The fixed element is inside `#landing-view` so it hides correctly when the view is hidden.

**Task 7 — setView() extended:** Replaced four individual toggle calls with a forEach loop over `['landing','form','followup','loading','dashboard']`. Existing `#progress-sticky` is inside `#form-view` so it hides automatically when the form view is hidden — no explicit handling needed.

**Task 8 — startNew() and DOMContentLoaded:** `startNew()` now navigates to `'landing'` instead of `'form'`. `DOMContentLoaded` checks for `l2l-draft` in localStorage; if present, loads draft and shows form; otherwise shows landing.

**Task 9 — Dashboard max-width:** Changed inner container from `max-w-6xl` to `max-w-4xl`.

---

## Deviations from Plan

- The decorative axes SVG element was given `position:fixed` to place it in the viewport corner. It lives inside `#landing-view`, so when that view is hidden (`display:none`), the fixed element is also hidden — CSS spec behaviour. No JS needed to manage it.
- Light mode `html.light` block left unchanged (was out of scope per technical design).
- No changes to the `/version` API fetch or `app-version` element (not present in this branch's base).

---

## Decisions Made

- **Grid opacity 0.4** (vs 0.35 in plan) — slightly more visible at the navy background; still subtle.
- **Flask SVG icon** uses `r="0.6"` circles for the "bubbles" inside the flask body — small enough to read as scientific detail at 26×26 px.
- **`clamp(36px, 5.5vw, 64px)`** for the hero headline — scales between mobile and desktop without a media query.
- **Decorative axes SVG** sized at 130×130 px — visible but not distracting at 8% opacity.

---

## Blockers Encountered

None.

---

## Adjacent Issues Spotted

- The worktree base (`a2bafba v1.1`) has "Save Project" as the save button label; the version I read in the session had "Rename". Minor label inconsistency — not in scope.
- `startNew()` in the worktree base does not reset `currentAnalysisId` to null. Not introduced by this PR but worth a follow-up fix.
- Light mode dark background: the grid texture is applied to the body's `background-image` property, which persists in light mode. At the light palette the grid colour `rgba(30,58,90,0.4)` becomes visible against white as a blue-grey grid. This looks acceptable but may need adjustment in a future light-mode redesign ticket.
