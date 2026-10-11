# NexusCloud Orchestra — Design System & Theme Specification

> **Theme Core:** *Night Sky ground (`#060C16`), Deep-Blue Glass surfaces (`#0B1828`), Frost typography (`#EAF0F7`), and a Warm Gold accent (`#F3C56F`).*

This document defines the visual design system, token architecture, typography hierarchy, component behaviors, and motion principles for **NexusCloud Orchestra**, mirroring the aesthetic established in the high-fidelity marketing landing page (`public/landing/`) and the authenticated web application (`frontend/src/`).

---

## 1. Design Philosophy & Atmosphere

NexusCloud Orchestra orchestrates multi-cloud storage across AWS, GCP, Azure, Cloudflare R2, Backblaze B2, Oracle Cloud, and IBM Cloud. The visual language conveys:

* **Cosmic & Aviation Atmosphere:** Deep atmospheric gradients reminiscent of high-altitude flight at twilight — transition from dark indigo stratosphere (`#0C2230`) into deep midnight space (`#060C16`).
* **Tactile Optical Glass:** Frosted translucent cards (`backdrop-filter: blur(14px)`), hairline frost borders, and subtle glows over deep surfaces.
* **Precision Telemetry:** Monospace kickers, tabular figures (`tabular-nums`), weighted quota bars, and deterministic visual indicators.
* **Warmth Amidst Cold Space:** Gold accents (`#F3C56F`) cut through the cold frost and deep blues to guide user attention to primary calls-to-action and key system states.

```
┌────────────────────────────────────────────────────────────────────────┐
│  SURFACE STACK                                                         │
│                                                                        │
│  [ Popovers / Modals / Toast ]     #122338 + Glass + Glow Shadow       │
│  [ Glass Panels / Cards ]          rgba(9, 20, 34, 0.46) + 14px blur   │
│  [ Elevated Surface ]              #0B1828 (Deep Blue)                 │
│  [ Canvas / Viewport Ground ]      #060C16 (Night Sky) + Radial Glows  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Color Palette & Tokens

### 2.1 Base & Surface Colors

| Token Name | Hex / CSS Value | Description / Usage |
|---|---|---|
| `--night` / `night` | `#060C16` | Ground canvas, root body background, deep letterbox |
| `--deep` / `deep` | `#0B1828` | Primary surface background for cards, sidebars, sheets |
| `raise` | `#122338` | Hovered card state, dropdown menu containers |
| `glass` | `rgba(9, 20, 34, 0.46)` | Frosted glass fill with background blur |
| `--line` / `line` | `rgba(234, 240, 247, 0.16)` / `#1E2D40` | Default structural hairlines, card dividers, table borders |
| `line-strong` | `#2E4058` | Emphasized borders, active input borders, scrollbar thumbs |

### 2.2 Typography Colors

| Token Name | Hex / CSS Value | Usage |
|---|---|---|
| `--frost` / `ink` | `#EAF0F7` | Headings, high-emphasis text, hero titles |
| `--mist` / `ink-2` | `rgba(234, 240, 247, 0.72)` / `#AAB3BF` | Standard body copy, descriptions, secondary navigation |
| `--dim` / `ink-3` | `rgba(234, 240, 247, 0.50)` / `#7D8896` | Metadata, micro-labels, placeholders, inactive states |

### 2.3 Accent & Gold Highlights

| Token Name | Hex / CSS Value | Usage |
|---|---|---|
| `--gold` / `accent` | `#F3C56F` | Primary button background, active tabs, brand star/dot, link hover |
| `--gold-hover` / `accent-deep` | `#FFD68A` | Hover state for gold buttons and interactive elements |
| `--gold-soft` / `accent-wash` | `rgba(243, 197, 111, 0.14)` / `#2A2416` | Badge backgrounds, highlighted table rows, gradient glows |
| `accent-line` | `#6B5631` | Subtle gold border outlines for highlighted cards |
| `on-accent` | `#1B1406` | High-contrast dark text inside gold buttons/badges |

### 2.4 Status & Feedback Palette

| Status | Main Color | Wash Background | Border Line | Semantic Role |
|---|---|---|---|---|
| **OK / Connected** | `#6FD3A0` | `#0F2A20` | `#1F5A40` | Healthy provider, completed upload, active quota |
| **Warning** | `#F59E5B` | `#2D1D10` | `#6A4422` | Quota approaching threshold, slow endpoint |
| **Bad / Danger** | `#F2827A` | `#2E1416` | `#6B2A2C` | Disconnected cloud, rate limit, upload failure |

---

## 3. Typography Architecture

Three distinct typefaces are loaded from Google Fonts / Fontsource to preserve visual hierarchy:

```
Display:    Syne (600, 700, 800)
Body:       Instrument Sans (400, 500, 600)
Monospace:  JetBrains Mono (400, 500)
```

### 3.1 Font Families & Roles

* **Display (`Syne`):**
  * Expressive, architectural, wide geometric sans.
  * Used for: Brand mark (`NEXUSCLOUD`), page titles (`h1`, `h2`), large metric callouts (e.g., `80 GB`, `₹249`).
* **Body (`Instrument Sans`):**
  * Modern, highly legible humanist grotesque.
  * Used for: UI copy, buttons, table cell contents, form labels, dialogs.
* **Monospace (`JetBrains Mono`):**
  * Technical developer typeface with high legibility.
  * Used for: Category kickers (`.label-caps`), quota bytes, hashes, API routes, terminal logs, tabular numbers (`tabular-nums`).

### 3.2 Type Scale Hierarchy

| Class / Role | Size / Line Height | Tracking | Weight & Font | Example Target |
|---|---|---|---|---|
| `hero__title` | `clamp(64px, 10vw, 156px) / 0.86` | `-0.02em` | Syne 800 | Landing Page Hero |
| `display-3xl` | `34px / 40px` | `-0.01em` | Syne 700 | Section Headers, Auth Page Titles |
| `display-2xl` | `26px / 32px` | `-0.01em` | Syne 700 | Card Titles, Modal Headers |
| `metric-xl` | `40px - 42px / 1.0` | `0` | Syne 700 | GB Counters, Pricing Figures |
| `text-lg` | `16px / 23px` | `0` | Instrument Sans 500 | Form Inputs, Hero Subtitles |
| `text-base` | `14px / 21px` | `0` | Instrument Sans 400 | Standard Body Text, Table Content |
| `text-sm` | `12.5px / 18px` | `0` | Instrument Sans 400 | Table Secondary Info, Tooltips |
| `label-caps` | `10px / 14px` | `0.08em` | JetBrains Mono 500 | Section Kickers, Chip Tags, Table Heads |

---

## 4. Materials, Elevation & Surface Effects

### 4.1 Frosted Glassmorphism (`.glass`)
Used for floating panels, modal cards, command palette, and header bars:

```css
.glass {
  background: rgba(9, 20, 34, 0.46);
  -webkit-backdrop-filter: blur(14px);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(234, 240, 247, 0.16);
}
```

### 4.2 Background Atmosphere
Both the landing page and app shell render an atmospheric multi-stage background:

```css
body {
  background:
    radial-gradient(60% 40% at 50% 0%, rgba(243, 197, 111, 0.08), transparent 70%),
    radial-gradient(120% 80% at 50% 120%, rgba(27, 58, 82, 0.55), transparent 60%),
    linear-gradient(to bottom, #0C2230 0%, #0B1828 35%, #060C16 100%);
  background-attachment: fixed;
}
```

### 4.3 Outlined Gold Sheen Effect (`.text-sheen`)
Applied to the word **CLOUD** in the landing hero and branding banners:

```css
.text-sheen {
  color: transparent;
  -webkit-text-stroke: 1.5px #EAF0F7;
  background: linear-gradient(
    100deg,
    transparent 0%,
    transparent 35%,
    #F3C56F 50%,
    transparent 65%,
    transparent 100%
  ) 0 0 / 250% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  animation: sheen 5s ease-in-out infinite;
}

@keyframes sheen {
  from { background-position: 100% 0; }
  to   { background-position: -150% 0; }
}
```

### 4.4 Shadows & Elevation Tokens
* `shadow-pop`: `0 24px 60px -20px rgba(0,0,0,0.7), 0 2px 10px -4px rgba(0,0,0,0.5)` (Modals, Auth panels)
* `shadow-glow`: `0 0 0 1px rgba(243,197,111,0.45), 0 10px 40px -12px rgba(243,197,111,0.35)` (Highlighted Pro cards)
* `shadow-toast`: `0 16px 40px -14px rgba(0,0,0,0.75)` (Notifications)

---

## 5. Components & UI Patterns

### 5.1 Buttons

```html
<!-- Primary / Solid Action -->
<button class="btn btn--solid">Start free</button>

<!-- Line / Frosted Action -->
<button class="btn btn--line">How it works</button>

<!-- Ghost / Compact Nav Action -->
<button class="btn btn--ghost">Log in</button>
```

* **Solid (`.btn--solid`):** Background `#F3C56F`, text `#1B1406`, rounded pill (`border-radius: 999px`). Hover: background `#FFD68A`, `translateY(-2px)`.
* **Line (`.btn--line`):** Border `#1E2D40`, background `rgba(234, 240, 247, 0.06)`, backdrop blur `8px`. Hover: border `#EAF0F7`.
* **Ghost (`.btn--ghost`):** Border `#1E2D40`, compact height (40px). Hover: border & text `#F3C56F`.

### 5.2 Provider Cards & Quota Bars

Provider tiles showcase connection health, free storage capacity, and egress cost:

* **Border hover:** Transitions to `rgba(243, 197, 111, 0.5)` with `-3px` elevation lift.
* **Quota progress bar:** Positioned at the bottom or inline with a gradient fill:
  ```css
  background: linear-gradient(90deg, #F3C56F, #FFE3A8);
  ```
* **Chips (`.chips li`):** Pill-shaped badges with `rgba(9, 20, 34, 0.46)` glass fill, `JetBrains Mono` font, and gold emphasized numbers.

### 5.3 Form Controls & Inputs

* **Container:** Background `#0B1828` with `#1E2D40` hairlines.
* **Focus State:** 2px ring in `#F3C56F/60` with offset in `#060C16`.
* **Error Envelope:**
  * Background: `#2E1416` (Bad wash)
  * Border: `#6B2A2C` (Bad line)
  * Text: `#F2827A` (Bad ink)

---

## 6. Motion & Interaction Guidelines

### 6.1 Transition Timing Tokens
* **Fast (`120ms`):** Hover states, button color shifts, tooltips.
* **Base (`180ms`):** Card elevation lift, input focus rings, tab switching.
* **Slow (`280ms`):** Modal backdrop opens, slide-overs, drawer menus.
* **Bezier Curves:**
  * Ease-out: `cubic-bezier(0.2, 0, 0, 1)`
  * Spring: `cubic-bezier(0.34, 1.3, 0.44, 1)`

### 6.2 Scroll Reveals (`.reveal`)
Sections enter view with a soft vertical rise and opacity ramp:

```css
.reveal {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.9s ease, transform 0.9s cubic-bezier(.2, .7, .2, 1);
  transition-delay: calc(var(--i, 0) * 70ms);
}
.reveal.is-in {
  opacity: 1;
  transform: none;
}
```

### 6.3 Accessibility & Reduced Motion
Any user specifying `prefers-reduced-motion: reduce` has animation durations collapsed to `0.01ms`, transitions disabled, and scroll behaviors set to immediate jump.

---

## 7. Responsive Breakpoint Standards

| Breakpoint | Target Width | Behavior |
|---|---|---|
| **Mobile (`< 560px`)** | Small phones | 1-column layouts, full-width buttons (`flex: 1 1 100%`), compact margins |
| **Tablet (`< 860px`)** | Tablets / portrait | Nav links collapse to hamburger / direct drawer, hero title scales via `vw` |
| **Desktop (`860px – 1199px`)** | Laptops | 2-column pricing & provider grids, fixed top navigation bar |
| **Wide (`1200px+`)** | Workstations | 4-column feature grids, max container constrained to `1160px` / `1180px` |

---

## 8. Directory Reference

* **Landing Page Tokens & CSS:** [frontend/public/landing/styles.css](file:///home/arun/Desktop/Nexuscloud/NexusCloud-Orchestra/frontend/public/landing/styles.css)
* **Tailwind Token Config:** [frontend/tailwind.config.ts](file:///home/arun/Desktop/Nexuscloud/NexusCloud-Orchestra/frontend/tailwind.config.ts)
* **React Global CSS & Base Layer:** [frontend/src/styles/index.css](file:///home/arun/Desktop/Nexuscloud/NexusCloud-Orchestra/frontend/src/styles/index.css)
* **Authentication Layout & Brand Mark:** [frontend/src/routes/auth-layout.tsx](file:///home/arun/Desktop/Nexuscloud/NexusCloud-Orchestra/frontend/src/routes/auth-layout.tsx)
