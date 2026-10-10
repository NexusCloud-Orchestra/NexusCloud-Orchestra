---
version: alpha
name: NEXUS CLOUD
description: A control plane that pools the free tiers of your own cloud accounts into one routed drive; it should feel like a calm night flight with instruments you can trust.
colors:
  night: "#060C16"      # ground
  deep: "#0B1828"       # solid card / panel surface
  raise: "#122338"      # hover rows, inset blocks
  line: "#1E2D40"
  line-strong: "#2E4058"
  ink: "#EAF0F7"        # body text
  ink-2: "#AAB3BF"      # secondary text
  ink-3: "#8C97A5"      # tertiary text, still >= 4.5:1 on raise
  gold: "#F3C56F"       # signal
typography:
  display:
    fontFamily: Syne
    fontWeight: 700
    letterSpacing: -0.01em
  body:
    fontFamily: Instrument Sans
    fontSize: 14px
    lineHeight: 1.5
  data:
    fontFamily: JetBrains Mono
    fontSize: 11px
rounded:
  xs: 4px    # status badges, kbd
  sm: 8px    # inputs, nav rows, search trigger
  md: 12px   # panels, dialogs, landing provider cards
  lg: 18px   # the single auth card
  pill: 999px # buttons and chips only
components:
  button-primary:
    backgroundColor: "{colors.gold}"
    textColor: "#1B1406"
    rounded: "{rounded.pill}"
---

## Overview

NEXUS CLOUD routes files across the user's own AWS, Azure, GCS, R2, B2, Oracle and IBM buckets. The look comes from the landing page's flight: a window seat through cloud to Paris at night. Night-sky ground, frost type, and one gold light, like a runway lamp or a city at altitude. The landing page is the brand moment. The app is the cockpit: the same palette, but quieter, denser and more legible.

Two token sources must stay in sync: `frontend/tailwind.config.ts` for the app, and the `:root` block of `frontend/public/landing/styles.css` for the static landing page. Change both together.

## Colors

- **Night (#060C16):** the ground everywhere.
- **Deep (#0B1828):** solid surface for panels and cards. Not glass.
- **Ink / ink-2 / ink-3:** about 16:1, 9:1 and 5.4:1 on night. ink-3 is at least 4.5:1 up to `raise`.
- **Gold (#F3C56F):** one job. It marks the primary action, the active location, and the brand dot. Keep it to roughly 2% of any desktop screen. Don't use it for decoration or headline words.

## Typography

- **Syne:** display only, at 26px and above (page titles, landing headlines, big numbers).
- **Instrument Sans:** everything a person reads, including labels, in sentence case.
- **JetBrains Mono:** data only (sizes, IDs, timestamps, bucket names, scores), at 11px or larger.
- **Uppercase mono kicker:** one per page, in the page header (`.kicker`), plus the landing eyebrows. Never on field labels, table heads or panel titles.
- **Gradient/outlined "CLOUD":** the only gradient text on the site, and only in the landing hero.

## Layout

The landing page is a pinned 270-frame scroll flight, followed by providers, a route line, a plan table and a closing CTA. The app is a fixed sidebar with a sticky topbar and a single content column at a max width of 1160px.

## Elevation & Depth

Surfaces are flat and separated by 1px lines. Blur (`backdrop-filter`) only appears where content actually moves behind it:
- the landing flight panels over the canvas,
- the landing nav once it is solid,
- the app topbar,
- the scrim behind modals, drawers and the command palette.

Shadows only appear on floating layers (dialogs, toasts).

## Shapes

Radius by role, as in the front matter. Progress bars and status dots stay round.

## Components

- **App:** `PageHeader` (kicker, title, description), `Panel`/`PanelHeader` (sentence-case title, mono meta), `Meta` (spaced metadata items), and `StatusBadge` (dot, icon and text, sentence case).
- **Landing:** `.btn--solid`/`.btn--line`, `.route` (the four stops), `.plans` (comparison table).

## Do's and Don'ts

- Do keep the scroll-flight canvas, the peaks plus gold-dot glyph, and the night palette with its gold accent.
- Do add a token here before a page uses it.
- Don't change: Syne / Instrument Sans / JetBrains Mono, night plus gold, or the hero "CLOUD" sheen. These were all chosen by the product owner.
- Don't use:
  - mono uppercase field labels (SD4),
  - "A · B · C" meta strings (SD4d),
  - decorative 01/02/03 eyebrows (SD6),
  - a second accented headline word (SD5),
  - glass on flat backgrounds (K3),
  - pills on cards or inputs (K2),
  - colored top-border feature cards (K4),
  - a "Most popular" pricing badge (L7),
  - arrow glyphs welded to link text (CP3),
  - overshoot easing (M4).
