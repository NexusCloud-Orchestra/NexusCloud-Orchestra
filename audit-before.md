# NEXUS CLOUD: AI-Design Audit (Before)

Audit only, no code was changed. Skill: `avoid-ai-design-main/` (detect mode), using `SKILL.md`, `references/ai-tells-catalog.md` and `scripts/detect.mjs`.
Date: 2026-10-09 · Branch: `feat/landing-theme` (after the retheme commit `f58f2e6`).

## 1. Scope and method

| Surface | Files | Context profile |
|---|---|---|
| Landing page (scroll-flight, 270 frames) | `frontend/public/landing/index.html`, `styles.css`, `main.js`, `config.js` | `landing`: expressive, so brand tells are allowed when the brief asked for them |
| Auth pages | `frontend/src/routes/{login,register,forgot-password,reset-password,auth-layout}.tsx` | `landing`-adjacent (brand moment) |
| App (`/app/*`) | `frontend/src/routes/app/*`, `components/**`, `styles/index.css`, `tailwind.config.ts` | `dashboard` / `inside-design-system`: consistency matters more than novelty |

**Method**

1. **Static scan:**
   ```bash
   node avoid-ai-design-main/scripts/detect.mjs frontend/src frontend/public/landing frontend/index.html frontend/tailwind.config.ts
   ```
   Result: **21 findings: P0 2 · P1 14 · P2 5.**
2. **Rendered pass:** headless Chrome over CDP against the dev server (`localhost:5173`, backend `localhost:7575`), logged in as a test user. Viewports were 1440×900 and 390×844. For each screen, the script computed WCAG contrast of every visible text node against its effective background, along with the font families and sizes in use, uppercase-mono label counts, `backdrop-filter` elements, border radii, shadows, gold-accent area share, horizontal overflow, and network payload.
3. **Manual review:** copy, section order, and cross-page consistency (X1).

**Tags:** ⚙ = certain from the code (scanner or source) · 👁 = measured on the rendered page · ~ = inferred judgment.

## 2. Audit

### P0: the strongest tells

| ID | Tell | Location | Why it reads as AI | Tag |
|---|---|---|---|---|
| C6 | Gradient-filled headline text | `frontend/src/styles/index.css:114` (`.text-sheen`, used for "CLOUD" on the auth pages) | Gradient or clip-text on a headline is the single most common generated-hero tell | ⚙👁 |
| C6 | Gradient-filled headline text | `frontend/public/landing/styles.css:92` (`.hero__title span`, outlined gold-sheen "CLOUD") | Same tell, on the hero wordmark | ⚙👁 |

### P1: strong tells

| ID | Tell | Location | Why | Tag |
|---|---|---|---|---|
| K3 | Glassmorphism by reflex (`backdrop-blur`) | `frontend/src/components/layout/command-palette.tsx:127`, `frontend/src/components/layout/shell.tsx:129` (topbar), `frontend/src/components/ui/drawer.tsx:67`, `frontend/src/components/ui/modal.tsx:49`, `frontend/src/routes/auth-layout.tsx:21`, `frontend/src/styles/index.css:101-102` (`.glass`) | The blur is applied to cards and panels that sit on a flat background with nothing behind them to blur. Rendered counts: 3–4 elements on most app pages, **12 on Settings** | ⚙👁 |
| K3 | Glassmorphism | `frontend/public/landing/styles.css:45, 68, 70, 109` and more | Justified over the moving canvas. Below the flight (after-section, pricing) there are still 6 and 8 blurred elements over a static background | ⚙👁 |
| SD4 / T5 | Mono uppercase "kicker" labels everywhere | Every app page (`label-caps`, `font-mono text-2xs uppercase tracking-kicker`) | The technical-template look. 10px mono caps is the **most frequent text size** on Overview, Files, Clouds, Router, Activity and Settings (see §3) | 👁 |
| SD5 | One accented word per headline | `frontend/public/landing/index.html:46` "CLOUD", `:111` "80 GB" | A formula that is applied to every headline loses its emphasis | ⚙ |
| SD6 | Decorative numbering | `frontend/public/landing/index.html:77-79` (flow steps 01/02/03), panel eyebrows "01 · / 02 · / 03 ·" | The eyebrow numbers are decoration. The flow steps are a real sequence | ⚙ |
| T2 | Trend display face | `frontend/public/landing/index.html:10` (Syne), reused across the app | Syne is a common "creative-tech" pick in generated sites | ⚙ |
| I3 | Default Lucide set | `frontend/src/components/ui/status.tsx:1` (Check), `frontend/src/routes/app/overview.tsx:2` (ArrowRight, ArrowUpRight) | The stock icon set at default stroke | ⚙ |
| CP3 | Arrow glued to link copy | `frontend/src/routes/app/quota.tsx:92` "Manage plan in Settings →", `frontend/src/routes/app/overview.tsx:187, 225, 276` (ArrowUpRight / ArrowRight after "All files", "Full timeline", "View quota") | "Verb + →" CTA reflex | ⚙ |
| K7 | Missing `:focus-visible` | `frontend/public/landing/index.html` (scanner) | **False positive.** `frontend/public/landing/styles.css` defines a gold `:focus-visible` outline, and the rule is present in the rendered page's stylesheet | ⚙👁 |
| K2 | One radius for everything | App: `9999px` pills on 9–16 elements per page plus 16px cards. Landing: `999px` on 21 elements plus 18px cards | Uniform radius regardless of role (button, chip, input, card) | 👁 |
| K4 | Colored top-border card | `frontend/public/landing/styles.css` `.how article` (gold `border-top` plus gradient wash) | Classic feature-card ornament | ⚙ |
| L2 | Identical card row | Landing "How it works": 4 identical cards (Connect / Route / Transfer / Track) | An icon/heading/body ×N grid | 👁 |
| L7 | Template pricing | Landing pricing: 4 plans, "Most popular" badge plus highlighted gradient card | The stock SaaS pricing block | 👁 |
| L9 | Stock section waterfall (partial) | Landing order: hero → features → CTA → providers → how it works → pricing → closing CTA → footer | Below the flight, the order follows the default template | 👁~ |

### P2: weak tells, worth fixing when you're nearby

| ID | Tell | Location | Why | Tag |
|---|---|---|---|---|
| SD4d | Middle-dot meta strings | `frontend/src/components/layout/command-palette.tsx:183-184` ("Navigate · Files on this device list", "↑↓ move · ↵ select · esc close"), `frontend/src/routes/app/activity.tsx:91-92`, `frontend/src/routes/app/files.tsx:340-345`, `frontend/src/routes/app/quota.tsx:72-73` | The "A · B · C" metadata cadence | ⚙ |
| M4 | Spring / overshoot easing | `frontend/tailwind.config.ts:79` `spring: cubic-bezier(0.34, 1.3, 0.44, 1)` | Bouncy overshoot in a utility dashboard | ⚙ |
| C9 | Low-contrast micro text | Topbar `⌘K` kbd, 10px `#7D8896`, **4.41:1** (below 4.5) on every app page | The muted-gray-on-dark small-text pattern, and a real AA miss | 👁 |
| SD2 / C7 | Dark navy plus a single neon-ish accent | Global palette: night `#060C16`, gold `#F3C56F` | Close to the "dark mode with one glow color" cluster | ~ |
| K12 | Tag-chip clusters | Landing provider tags | Pill chips as filler texture | 👁~ |

## 3. Rendered measurements

| Screen | Low-AA text | Mono-caps labels / text nodes | Most common size | Backdrop-blur elements | Radii | Gold area |
|---|---|---|---|---|---|---|
| Landing hero (1440) | none | 2 / 17 | 14px | 2 | 999px | 0.4% |
| Landing after-section | none | **27 / 101** | 14px (10px ×22) | 6 | 999px ×21, 18px ×7 | 1.6% |
| Landing pricing | none | **16 / 25** | 11px mono | 8 | 999px ×8 | 0% |
| Landing mobile (390) | none | 1 / 12 | 15px | 2 | 999px | 4.7% |
| Login | none | 2 / 28 | 10px ×11 | 2 | 9999 / 20 / 10px | 0.2% |
| Overview | ⌘K 4.41:1 | 14 / 62 | **10px ×25** | 4 | 9999px ×12, 16px ×4 | 0.5% |
| Files | ⌘K | 8 / 33 | **10px ×13** | 4 | 9999px ×11 | 0.2% |
| Clouds | ⌘K | 7 / 28 | **10px ×12** | 3 | 9999px ×10 | 0.3% |
| Router | ⌘K | 7 / 30 | **10px ×13** | 4 | 9999px ×10 | 0.5% |
| Quota | ⌘K | 13 / 40 | **10px ×18** | 3 | 9999px ×9 | 0% |
| Activity | ⌘K | 8 caps, **32 mono / 55** | **10px ×32** | 3 | 9999px ×9 | 0% |
| Settings | ⌘K | 15 / 55 | **10px ×22** | **12** | 9999px ×16 | 0.3% |

**Other checks**

| Check | Result |
|---|---|
| Fonts | Syne, Instrument Sans and JetBrains Mono load and render on every screen (T7 OK) |
| Horizontal overflow | None at 390px (landing `scrollWidth` = 390) |
| `prefers-reduced-motion` | Honoured on the landing page (media rule present) and in the app (global rule in `index.css`) |
| Focus | `:focus-visible` present on the landing page and in the app |
| Shadows | Almost none (good, no K1 stacked soft shadows) |
| Emoji | None (I2 clean) |
| Fake stats | None. Provider and plan numbers come from the live `/providers` and `/plans` API, with an estimate note (L4 clean) |
| Landing payload | 270 previews (4.2 MB) gate the "Boarding %" loader and `body.is-loading` scroll lock. After that, `fetchBlobs()` eagerly pulls all 270 4K frames (**71 MB**) over 6 parallel workers. 246 frame requests were observed on one load. This is a performance risk, not an AI tell |

## 4. Assessment

The palette is disciplined (gold covers ≤1.6% on desktop), contrast passes almost everywhere, and motion respects user settings. The copy is specific (AES-256-GCM, 15-minute presigned URLs, ₹0) rather than hollow. The AI-template feel comes from a **combination**: mono uppercase kickers on almost every block, plus blur on non-layered surfaces, plus pills everywhere, plus gradient headline text. Any one of these is defensible. All four together, on every page, read as a generated theme.

| Finding | Verdict | Action |
|---|---|---|
| C9 ⌘K at 4.41:1 | **Clear problem** (accessibility comes first regardless of tier) | Fix: use `ink-2` (`#AAB3BF`) or 11px+ |
| K7 landing focus | False positive | Leave |
| SD4/T5 mono-caps density in the app | **Clear problem** for a `dashboard` profile. 10px mono is the dominant text size, which also hurts readability | Fix: keep mono for data (IDs, sizes, timestamps). Use sentence-case Instrument Sans for section labels. Aim for ≤3 kickers per page |
| K3 blur in the app | **Clear problem.** It blurs flat backgrounds, and Settings has 12 blurred elements | Fix: keep blur only on the topbar, modal/drawer scrim and command palette. Cards should be solid `deep` (`#0B1828`) with a 1px line |
| K3 blur on landing (flight panels) | Judgment call: earned over the moving canvas | Leave over the flight. Remove from the after-section and pricing cards |
| C6 gradient "CLOUD" (landing hero) | Judgment call. It is part of the design the user chose ("the brief wins") | Leave on the landing hero |
| C6 `.text-sheen` on auth pages | Judgment call that leans toward fix: it repeats the hero trick on utility screens | Consider a solid `ink` wordmark with the gold dot glyph only |
| K2 uniform pill radius | Clear but low-cost | Fix: pills for buttons and chips only. 10–12px for inputs and cards, 16–18px for large panels |
| CP3 "→" / ArrowUpRight links | Minor | Fix: drop the glyphs. Link text is enough |
| SD4d middle-dot meta | Minor | Fix in the app (use separate columns or spacing). Keyboard hints in the palette can stay as `<kbd>` |
| M4 spring easing | Minor | Fix: a standard ease-out (`cubic-bezier(0.2, 0, 0, 1)`) with no overshoot |
| SD5 accented word | Judgment call. "CLOUD" is the brand. "80 GB" is a second use of the same trick | Keep "CLOUD". Un-accent "80 GB" |
| SD6 numbering | Flow steps 01/02/03 are a real sequence, so keep them. Panel eyebrows "01 · 02 · 03 ·" are decorative | Drop the eyebrow numbers, or make them the flight's altitude/time readout so they mean something |
| K4 + L2 "How it works" cards | Clear template pattern | Fix: render as a horizontal route line (Connect → Route → Transfer → Track) that echoes the flight path, with no top-border cards |
| L7 pricing | Judgment call. The data is real and the note says "for reference" | Keep the data. Drop the "Most popular" badge and gradient, and use a plain comparison table |
| L9 section order | Judgment call. The scroll-flight is the signature and offsets the waterfall | Leave. Optionally merge the two CTAs ("Arrival" and "Ready for departure?") |
| SD2/C7 dark plus gold | Judgment call, earned by the subject (night flight over Paris) | Leave |
| T2 Syne | Judgment call. It matches the landing design the user picked | Leave. Limit it to display sizes (≥26px). It already is in the app |
| I3 Lucide | Minor. Acceptable in a `dashboard` profile | Leave. Optionally set a consistent `strokeWidth={1.5}` |
| K12 provider tags | Minor | Leave |
| Landing 71 MB frame payload | **Performance problem** (not a tell) | Fix: WebP/AVIF frames, 1080p/1440p tiers chosen by viewport and DPR, and fetch only the ±N window around the playhead on mobile or when `saveData` is set |

## 5. Prioritised recommendations

1. **Accessibility:** raise ⌘K kbd contrast to ≥4.5:1.
2. **App density:** cut mono uppercase kickers by about 70% and move label text to Instrument Sans 12–13px sentence case.
3. **Blur:** restrict `backdrop-blur` to the topbar and overlays. Make `.glass` cards solid.
4. **Radius by role:** pills only for buttons and chips.
5. **Small copy and motion fixes:** remove the "→" and arrow icons from link text, middle-dot meta strings and the spring easing.
6. **Landing below the flight:** rebuild "How it works" as a route line, simplify pricing, un-accent "80 GB", and drop the decorative 01/02/03 eyebrows.
7. **Auth pages:** replace the `.text-sheen` gradient with a solid wordmark.
8. **Performance:** compress and tier the 270 frames, and lazy-window the 4K fetch.
9. **Consistency (X1):** the landing page uses raw CSS variables while the app uses Tailwind tokens, so there are two token sources. "Back to home" points at `/landing/index.html`, and the nav and footer aren't shared. Add a `DESIGN.md` that defines the tokens (color, type scale, radius by role, blur policy, label policy) and generate `landing/styles.css` variables from the same source.

## 6. Strengths to preserve

- The scroll-driven 270-frame flight through the clouds to Paris at night. This is the signature, and it is not a template.
- The peaks + gold-dot brand glyph.
- The committed night palette with a gold accent that is used sparingly.
- Specific, honest copy (real crypto and presign details, numbers from the live API, ₹0 entry) with no emoji and no fake social proof.
- Working reduced-motion, focus states and mobile layout with no overflow.

## 7. Fix pass (rewrite mode)

**Status:** applied on `feat/landing-theme` and not yet committed. Profiles: `landing` for the landing page; `dashboard` / `inside-design-system` for the app. The landing page got a surgical pass below the flight. The app got a surgical pass on tokens and shared components. The contract is now in [`DESIGN.md`](DESIGN.md).

**Scanner:** 21 findings (P0 2 · P1 14 · P2 5) before; **0 findings** after. The remaining deliberate choices are marked with `avoid-ai-design-ignore` comments that cite DESIGN.md:
- the hero "CLOUD" sheen,
- Syne,
- the real 01/02/03 sequence,
- blur over the flight canvas and overlay scrims,
- the Check status icon.

**Typecheck, lint and build:** `tsc -b`, `eslint --max-warnings 0` and `vite build` all pass.

**Rendered after the fix:**

| Screen | Low-AA text | Mono-caps labels | Most common size | Blur elements |
|---|---|---|---|---|
| Overview | none (was ⌘K 4.41:1) | 1 (was 14) | 12.5px sans (was 10px mono) | 1 (was 4) |
| Files / Clouds / Router | none | 1 (was 7–8) | 12.5px / 14px sans | 1 |
| Quota | none | 1 (was 13) | 12.5px sans | 1 |
| Activity | none | 1 (was 8). Mono stays on timestamps, actions and IPs, which are data | 11px mono data | 1 |
| Settings | none | 1 (was 15) | 12.5px sans | 1 (was 12) |
| Login | none | 1 | n/a | 0 (was 2) |
| Landing "How it works" | none | 9 (was 27 for the whole after-section) | 15px | 2 (nav + CTA) |
| Landing pricing | none | 4 (was 16) | 15px | 2 (was 8) |

**Frame payload** (encoded bytes, sharp frames limited to a window around the playhead):

| Viewport | Frame tier | Frames fetched while idle at top |
|---|---|---|
| 1440×900 | `frames-1080` WebP | 49, 1.7 MB including previews |
| 2560×1440 | `frames-1440` WebP | 49, 2.4 MB |
| 390×844 @2x | `frames-1440` WebP | 49 |

Before, every visitor downloaded all 270 frames at 4K (71 MB). The 4K JPEGs are still the tier above 2560px. `saveData` / 2G connections cap at 1080p with a smaller window.

**What changed**

| Finding | Fix |
|---|---|
| C9 | `ink-3` raised to `#8C97A5` (≥4.5:1 up to `raise`). The ⌘K kbd now uses `ink-2` |
| SD4/T5 | `label-caps` was replaced by sentence-case `.meta-label`. Panel titles are now sans semibold. The only remaining kicker is `.kicker`, once per page header. Mono is reserved for data, and 10px text is gone |
| K3 | `.glass` is now a solid `.surface`. Blur was removed from the sidebar, panels, secondary buttons and the auth header. It stays on the topbar and overlay scrims |
| K2 | Radius by role: nav rows, search and inputs 8px; panels 12px; auth card 18px; pills only on buttons and chips. Landing cards use 12px |
| C6 (auth) | The `.text-sheen` gradient was removed. The landing hero keeps its sheen as the single brand moment |
| CP3 / I3 | Removed "→" and the ArrowRight/ArrowUpRight icons from link text |
| SD4d | "A · B · C" strings were replaced by a `Meta` component (spaced items) and plain sentence copy. The palette hints are `<kbd>` keys |
| M4 | Removed the `spring` easing token |
| SD5 / SD6 | "80 GB" is no longer accented. The decorative "01 · / 02 · / 03 ·" eyebrows were dropped. The real Request/Upload/Confirm sequence keeps its numbers |
| K4 + L2 | The "How it works" cards became a single route line with four stops (a hairline with dots, the last one gold like the brand glyph), echoing the flight path |
| L7 | The pricing cards plus "Most popular" badge became a plain comparison table with the same data, horizontally scrollable on mobile |
| X1 | `DESIGN.md` added. "Back to home" goes to `/`. Both token sources are documented to change together |

**Preserved:** the 270-frame scroll flight (same frames, smoothing and panels), the hero "CLOUD" sheen, the peaks plus gold-dot glyph, the night/gold palette and the three typefaces. Also every route, form, upload/route/quota feature, focus states, reduced-motion, and the API wiring (the uncommitted `client.ts` / `.gitignore` edits were left untouched).

**Judgment against the success tests:** the changes are *justified* (each traces to the flight or the cockpit role), *coherent* (one gold light, one display moment), and *not a second-order default* (the mono-chrome cluster was removed instead of being swapped for another trend). The landing page and app are *consistent* through `DESIGN.md`.

**Left as is:** L9 section order (the flight offsets it) and the two closing CTAs.
