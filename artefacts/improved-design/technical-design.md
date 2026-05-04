# Technical Design — Improved Design

**Ticket:** Improved Design (P0)  
**Pipeline:** Dev  
**Date:** 2026-05-04

---

## Scope

**In scope:**
- New landing page view shown on initial load, with hero copy and a single "Try me now" CTA
- Consistent `max-w-4xl` (896 px) across all views (form, followup, loading, dashboard)
- Dark mode colour scheme changed to lighter navy (more blue-tinted, less near-black)
- Burger menu moved to top-right corner of the header
- Sidebar repositioned to slide in from the right
- Logo treatment upgraded with an SVG icon alongside the wordmark
- Subtle retro-scientific grid texture on the body background

**Out of scope:**
- Backend or API changes
- Light mode full redesign (light mode remains functional but is not the primary focus)
- Animated hero effects (parallax, particles)
- Splitting `index.html` into multiple files
- Mobile layout overhaul beyond what the above changes require

---

## Technical Approach

All changes are contained within `static/index.html`. No backend files are touched.

### 1. Colour variables — lighter navy dark mode

Adjust `:root` CSS variables so the dark palette reads as genuine navy rather than near-black:

| Variable | Current | New |
|---|---|---|
| `--bg` | `#0f1419` | `#0c1a2e` |
| `--card` | `#151b26` | `#0f2236` |
| `--inp` | `#1a2332` | `#132840` |
| `--border` | `#2a3849` | `#1e3a5a` |
| `--grid` | `#2a3849` | `#1e3a5a` |
| `--grid2` | `#151b26` | `#0f2236` |

Accent purple and turquoise remain unchanged — they already contrast well against navy.

### 2. Landing page view

Add a `#landing-view` div that is shown by default on `DOMContentLoaded` (unless localStorage has a draft). The view is a full-viewport hero:

- Eyebrow label: "Investor Readiness Analysis" (monospace, uppercase, muted)
- Headline (large): "From research bench to investor meeting."
- Sub-copy: one-line value prop (what the tool does)
- CTA button: "Try me now →" — calls `setView('form')`
- Background: subtle scientific grid texture (see §6 below)
- Optional decorative SVG line-art (crosshair / axis marks) in a bottom-right corner

### 3. View-switching

Extend `setView(v)` to handle `'landing'`:

```js
function setView(v) {
  ['landing','form','followup','loading','dashboard'].forEach(id => {
    document.getElementById(id + '-view').classList.toggle('hidden', v !== id);
  });
  document.getElementById('save-btn').classList.toggle('hidden', v !== 'dashboard');
  document.getElementById('progress-sticky').classList.toggle('hidden',
    v !== 'form');
}
```

`DOMContentLoaded` logic:

```js
const hasDraft = !!localStorage.getItem('l2l-draft');
setView(hasDraft ? 'form' : 'landing');
```

`startNew()` calls `setView('landing')` instead of `setView('form')` so returning users always see the landing first.

### 4. Burger menu → top-right; sidebar → right side

**Header DOM** rearranged so the left cluster contains only the logo, and the right cluster contains autosave status, theme toggle, save button, and the burger button (in that order).

**Sidebar** CSS changes:
- `left-0` → `right-0`
- `transform: translateX(-100%)` → `transform: translateX(100%)`
- `border-right` → `border-left`

No JS changes needed beyond ensuring the sidebar open/close logic toggles correctly.

### 5. Logo treatment

Replace the plain text logo with an icon + wordmark group:

- SVG icon: stylised flask / Erlenmeyer shape (24×24), stroke using `var(--accent)`
- Wordmark: "Lab2Launch" bold, same as current, `var(--accent)` colour
- Subtitle: "Research → Investor-Ready" in muted text below

The icon is inline SVG — no external asset required.

### 6. Retro scientific grid texture

Apply a subtle graph-paper grid to the `body` background:

```css
body {
  background-color: var(--bg);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='rgba(30%2C58%2C90%2C0.35)' stroke-width='0.5'/%3E%3C/svg%3E");
}
```

This is only visible in dark mode; in light mode the grid lines become invisible against the light background (or the light mode variable can set a matching light-tinted grid). The grid stroke colour is dark-navy so it never competes with content.

### 7. Consistent max-width

All view containers standardised to `max-w-4xl mx-auto px-6`:

- `#form-view`: already `max-w-4xl` — no change
- `#followup-view`: already `max-w-4xl` — no change
- `#loading-view`: already `max-w-4xl` — no change
- `#dashboard-view > div`: change from `max-w-6xl` to `max-w-4xl`

**Dimension card grid** currently `xl:grid-cols-3` — at 4xl (896 px) this still fits three columns comfortably (each ~280 px). No change needed; the Tailwind `xl` breakpoint is 1280 px so at 896 px it already falls back to 2 or 1 column.

**Radar SVG** is already `max-width:380px` — no change needed; it fits within 4xl.

---

## Data Model Changes

None.

---

## API / Interface Changes

None — pure frontend.

---

## Integration Points

| Touch point | Change |
|---|---|
| `setView()` | Add `'landing'` case; hide `#progress-sticky` for non-form views |
| `startNew()` | Navigate to `'landing'` instead of `'form'` |
| `DOMContentLoaded` | Check localStorage draft before choosing initial view |
| Header DOM | Reorder children; logo stays left, burger moves right |
| Sidebar DOM/CSS | Flip to right side |

---

## Acceptance Criteria

1. **Given** fresh load (no localStorage draft), **when** page opens, **then** landing page is shown, not the form.
2. **Given** landing page is displayed, **when** user clicks "Try me now", **then** form view is shown.
3. **Given** localStorage contains a draft, **when** page loads, **then** form is shown directly (landing skipped).
4. **Given** any view is active, **when** measuring max content width, **then** all views cap at `max-w-4xl` (896 px).
5. **Given** dark mode is active, **when** comparing to previous version, **then** background is noticeably more navy/blue, less black.
6. **Given** the header is rendered, **when** inspecting the right side, **then** the burger menu icon appears top-right.
7. **Given** burger is clicked, **when** sidebar opens, **then** it slides in from the right edge.
8. **Given** the header is rendered, **when** inspecting the logo, **then** a flask/science SVG icon appears alongside the "Lab2Launch" wordmark.
9. **Given** dark mode is active, **when** viewing any page against the background, **then** a subtle grid texture is visible.

---

## Technical Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Sidebar right-side flip breaks on narrow screens | Medium | Test at 375 px; sidebar width is `w-72` (288 px) which is fine |
| `max-w-4xl` dashboard feels cramped for the 5-card dimension grid | Low | Grid already drops to 2 cols below xl; radar has its own max-width |
| Grid texture not visible enough or too distracting | Low | Stroke opacity is 0.35 — adjust until balanced |

---

## Deferred / Out of Scope

- Animated landing page (scroll reveals, parallax, particle canvas)
- Light mode full redesign to match new aesthetic
- Logo as a separate `.svg` asset file
- Responsive header with collapsed navigation links
