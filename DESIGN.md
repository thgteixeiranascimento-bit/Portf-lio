---
version: 1.0
name: Portfolio-financas-corporativas
description: Executive financial portfolio — dual-theme (light/dark), data-visualization-first interface for FP&A analysis. Anchored on cream (#f9f9f7) for light mode and deep near-black (#0d0d0d) for dark mode, with professional sans-serif typography and a curated palette of four data series (blue for real/base, orange for budget/downside, green for forecast/upside, red for stress/unfavorable). Status indicators (green, yellow, orange, red) thread through charts, tables, and checks. No dependencies — vanilla CSS, SVG charts, native HTML components. Premium executive aesthetic, accessibility-first.
---

## Color System

### Primary Palette

#### Light Theme (default)
```
page:           #f9f9f7  (background, cream with warmth)
surface:        #fcfcfb  (cards, containers)
surface-2:      #f3f2ee  (secondary surfaces, hover states)
ink:            #0b0b0b  (primary text, near-black)
ink-2:          #52514e  (secondary text, body copy)
muted:          #898781  (tertiary, disabled text)
grid:           #e1e0d9  (gridlines, subtle borders)
baseline:       #c3c2b7  (baseline, horizontal rules)
border:         rgba(11, 11, 11, 0.10)  (all borders)
```

#### Dark Theme (prefers-color-scheme: dark)
```
page:           #0d0d0d  (background, deep black)
surface:        #1a1a19  (cards, containers)
surface-2:      #232322  (secondary surfaces)
ink:            #ffffff  (primary text, white)
ink-2:          #c3c2b7  (secondary text, muted white)
muted:          #898781  (tertiary text)
grid:           #2c2c2a  (gridlines)
baseline:       #383835  (baseline, rules)
border:         rgba(255, 255, 255, 0.10)  (all borders)
neutral-mid:    #383835  (mid neutral for dark)
shadow:         none  (no drop shadows in dark mode)
```

### Accent Colors

```
accent:         #2a78d6  (primary action, links — light mode)
accent-ink:     #1c5cab  (link text, hover state — light mode)
                #3987e5  (primary action — dark mode)
                #86b6ef  (link text — dark mode)
```

### Data Series (Four-Series Palette)
Used across all charts, tables, and financial data visualizations. Colors validated for accessibility and distinct at all light levels.

```
s1 (Real/Base):
  light:        #2a78d6  (blue)
  dark:         #3987e5  (brighter blue)

s2 (Budget/Downside):
  light:        #eb6834  (orange)
  dark:         #d95926  (darker orange-red)

s3 (Forecast/Upside):
  light:        #1baf7a  (teal-green)
  dark:         #199e70  (forest green)

s4 (Stress/Unfavorable):
  light:        #e34948  (red)
  dark:         #e66767  (lighter red)
```

### Status Indicators (Fixed across all themes)
```
ok:             #0ca30c  (success, green — light bg)
ok-text:        #006300  (success text)
warn:           #fab219  (warning, yellow)
serious:        #ec835a  (serious, orange alert)
bad:            #d03b3b  (failure, red alert)
```

### Sequential Palette (Heat maps, intensity scales)
```
seq-100:        #cde2fb  (lightest blue)
seq-200:        #9ec5f4
seq-300:        #6da7ec
seq-400:        #3987e5  (accent blue)
seq-500:        #256abf
seq-600:        #184f95
seq-700:        #0d366b  (darkest blue)
```

## Typography

### Font Stack
**Primary:** `system-ui, -apple-system, "Segoe UI", sans-serif`
**Monospace:** `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`

All typefaces rendered at system defaults (no web fonts) — ensures zero latency, respects user system preferences, offline-friendly.

### Typographic Scale

| Role | Size | Weight | Line Height | Letter Spacing | Usage |
|------|------|--------|-------------|----------------|-------|
| h1 | 2.1rem (33.6px) | 400 | 1.15 | -0.02em | Page titles, hero headlines |
| h2 | 1.4rem (22.4px) | 400 | 1.2 | -0.01em | Section headers |
| h3 | 1.08rem (17.28px) | 400 | 1.3 | 0 | Subsection headers |
| lead | 1.12rem (17.92px) | 400 | 1.55 | 0 | Introductory paragraphs, callouts |
| body | 1rem (16px) | 400 | 1.55 | 0 | Body text, table cells |
| caption | 0.88rem (14.08px) | 400 | 1.55 | 0 | Figure captions, metadata |
| eyebrow | 0.74rem (11.84px) | 700 | 1.4 | 0.12em | Section labels, uppercase tags |
| code | 0.88em | 400 | 1.5 | 0 | Inline code, monospace |
| mono | 0.88em | 400 | 1.5 | 0 | Monospace text blocks |

### Font Weights
Only `400` (regular) and `700` (bold) are used.
- Avoid adding weight mid-scale; instead shift size or color for hierarchy
- `font-weight: 700` only for eyebrow, strong emphasis, active states

## Component Library

### Buttons
**Icon Button (`.ico`)**
- Border: 1px solid `var(--border)`
- Background: `var(--surface)`
- Color: `var(--ink-2)`
- Padding: 5px 10px
- Border-radius: 8px
- Font-size: 0.84rem
- Hover: border upgrades to `var(--accent)`, text to `var(--ink)`

**Language Toggle (`.ico.lang`)**
- Variant of `.ico` with `font-weight: 700`, centered, min-width 40px
- Uppercase letter-spacing 0.04em

### Tags & Badges (`.tag`)
- Font-size: 0.72rem
- Font-weight: 700
- Letter-spacing: 0.04em
- Padding: 2px 9px
- Border-radius: 999px
- Text-transform: uppercase
- Default: `border: 1px solid var(--border)`, `background: var(--surface-2)`, `color: var(--ink-2)`

**Tag Variants:**
| Class | Color | Border | Background |
|-------|-------|--------|------------|
| `.tag.sim` | `var(--accent-ink)` | `color-mix(in srgb, var(--accent) 35%, transparent)` | `color-mix(in srgb, var(--accent) 9%, var(--surface))` |
| `.tag.okv` | `var(--ok-text)` | `color-mix(in srgb, var(--ok) 40%, transparent)` | `color-mix(in srgb, var(--ok) 9%, var(--surface))` |
| `.tag.resv` | `var(--ink)` | `color-mix(in srgb, var(--warn) 55%, transparent)` | `color-mix(in srgb, var(--warn) 14%, var(--surface))` |
| `.tag.nao` | `var(--bad)` | `color-mix(in srgb, var(--bad) 40%, transparent)` | `color-mix(in srgb, var(--bad) 8%, var(--surface))` |

### Navigation
**Header (`.site`)**
- Position: sticky, top: 0, z-index: 50
- Background: `color-mix(in srgb, var(--page) 88%, transparent)`
- Backdrop-filter: blur(8px)
- Border-bottom: 1px solid `var(--border)`

**Main Nav (`nav.main`)**
- Display: flex, gap: 4px
- Links: `color: var(--ink-2)`, `padding: 6px 10px`, `border-radius: 8px`, `font-size: 0.92rem`
- Hover: `background: var(--surface-2)`, `text-decoration: none`, `color: var(--ink)`
- Active (`.on`): `color: var(--accent-ink)`, `font-weight: 600`

### Forms (`.field`, `.inp`, `.seg-pro`)

A field is four parts in a fixed order — label, value readout, control, hint — so the eye finds the same thing in the same place in every form on the site.

```
.field
  ├── .lb        label (left) + .out live readout (right, pill, --font-num, nowrap)
  ├── .inp       control frame: input/select + optional .afx unit affix
  ├── .hint      what the control does and what it does not do
  └── .err       validation message, revealed by .field.invalid
```

| Token / rule | Value | Why |
|---|---|---|
| `--field-h` | 40px minimum | Touch-target floor; the same figure Stripe holds its fields to |
| `--hairline-input` | `color-mix(accent 26%, border)` | A cooler, slightly stronger fio than content borders — it says "you can type here" without a fill colour |
| Focus | border → `--accent` **plus** `--ring` (3px accent halo) | Border alone is too quiet at 1px; the halo carries the state |
| Invalid | border → `--bad`, `--ring-bad` on focus, `.err` revealed | Colour plus text, never colour alone |
| Unit affix | `.afx` inside the frame, `--surface-2` fill, hairline divider | The unit stays attached to the number under all wrapping |
| Disabled | `:has(:disabled)` dims the whole frame | The frame and its affix dim together, not just the input |
| Readout | pill, `--font-num`, `white-space: nowrap` | A live value that reflows mid-drag is unreadable |

**Segmented control (`.seg-pro`)** — for switching a view, never for submitting. Uses `aria-pressed` on real buttons (not radio styling), 34px minimum button height inside a 3px padded track, and scrolls horizontally below 620px instead of overflowing its container.

**Control-to-metric coupling:** when a control's meaning depends on the selected view, the control reconfigures with it — amplitude, step, unit and label all change together. A slider labelled "growth" that silently becomes a percentage-point shift is a trap; the label, the affix and the readout must all move at once.

### Layout
**Container (`.wrap`)**
- Max-width: 1120px
- Margin: 0 auto
- Padding: 0 20px
- Responsive: adjusts padding on mobile

### Shadow System
**Light Mode:**
```
box-shadow: 0 1px 2px rgba(11,11,11,.04), 0 4px 16px rgba(11,11,11,.05);
```
Subtle depth: used sparingly on cards, panels, overlays.

**Dark Mode:**
No shadows — contrast between surfaces provides sufficient depth.

## Spacing & Rhythm

Vertical rhythm anchored to **16px base line height (1.55)**.
- Headings: bottom margin varies by size (h1: 0.35em, h2: 0.5em, h3: 0.4em)
- Paragraphs: bottom margin 1em
- Gap patterns: 4px, 6px, 10px, 18px, 20px (multiples of spacing scale)
- Border radius: 5px (code), 8px (buttons, nav), 10px (containers)

## Accessibility

### Contrast Validation
All text meets WCAG AA standards for contrast:
- Light mode: `#0b0b0b` ink on `#fcfcfb` surface = 20:1 ratio
- Dark mode: `#ffffff` ink on `#1a1a19` surface = 19:1 ratio
- Secondary text meets 7:1 minimum

### Motion & Animation
- Respects `prefers-reduced-motion` media query
- No auto-playing animations
- Scroll behavior: `smooth` on html

### Keyboard Navigation
- All buttons focusable
- Focus visible (browser default or custom outlines)
- Tab order logical (left-to-right, top-to-bottom)

### Semantic HTML
- Heading hierarchy (h1 → h2 → h3)
- List markers for lists (`<ul>`, `<ol>`)
- Links open in same window by default; external links marked
- Tables use `<th>` for headers, `<tbody>` for data

## Numeric Type Voice

Serious financial interfaces split the type stack in two: an editorial face for prose and a distinct tabular face for figures. Binance does it with BinancePlex, Coinbase with CoinbaseMono, Stripe with `tnum` on every money value. The split is functional, not decorative — a column of numbers that does not align digit-to-digit cannot be scanned.

```
--font-num:  ui-monospace, "SF Mono", SFMono-Regular, "JetBrains Mono",
             "IBM Plex Mono", Menlo, Consolas, monospace
--num-feat:  tabular-nums slashed-zero
```

Applied via `.num`, and automatically inside `.tbl-pro td.n`, range outputs, and `input[type=number]`. Never applied to prose. No web font is loaded — the voice comes from the platform monospace stack, so it costs nothing and works offline.

**Rule:** every currency amount, rate, ratio, variance, and total renders in `--font-num`. Every sentence renders in the sans.

## Data Visualization

### Chart Color Palette
Uses the four-series palette (s1, s2, s3, s4) for all charts.
- Real / Base data: s1 (blue)
- Budget / Downside scenarios: s2 (orange)
- Forecast / Upside projections: s3 (green)
- Stress / Unfavorable outcomes: s4 (red)

SVG implementation (no dependencies):
- Axes rendered with `var(--grid)` color
- Labels: `var(--ink-2)` for light mode, `var(--ink-2)` for dark mode (remains muted)
- Gridlines: `var(--grid)` with opacity 0.5
- Tooltips: `var(--surface)` background, `var(--ink)` text

### Chart Header & Legend Placement (`.c-head`, `.legend-pro`)

The legend belongs in the chart header row, right-aligned against the title — not below the plot. Below-the-plot legends cost vertical space that the data should own and force the eye to travel down and back up to decode a series. In the header, "what this is" and "who is who" are read in one pass before entering the plot area.

```
.c-head          flex row · title block left · legend right · wraps on narrow
.c-titles        flex: 1 1 auto · min-width: 0
.legend          justify-content: flex-end
```

On narrow columns the legend wraps beneath the title — that is the intended responsive fallback, not a defect.

**Swatch shape encodes mark type** — the legend must not claim a mark the chart does not draw:

| Class | Shape | Encodes |
|-------|-------|---------|
| `.sw` | 12×12 rounded square | area, bar, stacked series |
| `.sw.line` | 16×3 bar | line series |
| `.sw.dot` | 9px circle | scatter, point series |

**Interactive legend** (`legendToggle: true`): each key becomes a `<button>` carrying `aria-pressed`, toggling its series. Rules:
- Never allow the last visible series to be switched off — the guard is in the toggle, not in the styling
- A toggled-off key drops to `opacity: .45` and its swatch goes `--muted`; the label stays readable
- Companion series (a dashed forecast paired with a solid actual) declare `legenda: false` and follow their partner through the `onToggle` hook — they never get a legend key of their own
- The tooltip is dismissed on toggle so a stale readout never survives the redraw

### Data Table (`.tbl-pro`)

| Element | Treatment | Why |
|---------|-----------|-----|
| Header row | `position: sticky; top: 0`, backdrop blur, uppercase 0.74rem, 0.07em tracking | The column ruler never leaves the screen on a long table |
| First column | `position: sticky; left: 0`, own background, right hairline | The row label survives horizontal scroll — without it a wide table is unreadable on mobile |
| Numeric cells | `.n` → `--font-num` + tabular + slashed zero, right-aligned | Digits align in a column; a slashed zero never reads as an O |
| Row hover | `color-mix(accent 5%, surface)`, first cell 9% | Tracks the eye across a wide row |
| Deltas | `.up` / `.down` / `.flat` — arrow glyph **and** color | Colour alone fails for colour-blind readers and in print |
| Total row | `.tot` — 2px `--baseline` top rule, `--surface-2` fill, weight 700 | The accounting convention for a summed line |
| Estimate row | `.est` — 2px dashed accent rule, italic, superscript `e` | Marks exactly where disclosed fact ends and the author's estimate begins |
| Empty cell | `—` with `.na` | A declared gap is not a zero, and must never render as one |
| Scroll affordance | CSS-only edge shadows via `background-attachment: local/scroll` | Shows clipped content without a scroll listener |
| Caption | `.tbl-cap` — title left, unit right in uppercase muted | The unit belongs in the frame, not repeated in every cell |
| Footnote | `.tbl-foot` — how the delta was computed, what `—` means | The reader should never have to guess the arithmetic |

**Rule:** a number in a table never appears without its unit reachable — either in the caption, the column header, or the cell itself.

### Rate versus Value (domain rule)

Absolute values (revenue, profit, balances) move in **percent**. Rates and ratios (ROE, efficiency, NIM, NPL) move in **percentage points**. Rendering a ratio's change as a percent is a category error and the design system must not make it easy: the delta column, the assumption control, and the projection all read the metric's declared `modo` (`"mult"` or `"pp"`) and format accordingly.

The direction of "good" is also per-metric. An efficiency ratio falling is an improvement, so its delta cell must not inherit the green-up / red-down default. Series declare `maiorMelhor: true|false`; the cell class follows the declaration, never the raw sign.

## Responsive Design

### Breakpoints
| Name | Pixel | Usage |
|------|-------|-------|
| Mobile | 360px–720px | Single column, stacked nav |
| Tablet | 721px–1120px | Two columns, full nav |
| Desktop | 1121px+ | Multi-column, full layout |

**Mobile Adjustments:**
- Header nav collapses; action buttons icon-only (labels hidden via `.lbl { display: none }`)
- `.wrap` padding shrinks to edge-safe margins
- Sticky header remains at top
- Tables scroll horizontally (overflow-x: auto, within scrolling container)

### Fluid Typography
Typography scales don't use `clamp()` — instead lock to specific sizes and test responsive behavior. Users who zoom or resize text maintain full readability.

## Dark Mode Implementation

Uses CSS `@media (prefers-color-scheme: dark)` without requiring user toggles — defaults to system preference. Where custom toggles exist (language, theme picker), stored in browser localStorage and applied via `color-scheme` attribute on `:root`.

```css
@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
    /* redefine --variable values */
  }
}
```

All component colors must work in both modes with no manual overrides per component.

## Usage Guidelines

### When to Use Each Color
- **Accent (#2a78d6 / #3987e5):** Primary CTAs, active navigation, link text, focus outlines
- **s1 (blue):** Real data, actuals, baseline scenarios in charts
- **s2 (orange):** Budget data, conservative forecasts, downside scenarios
- **s3 (green):** Best-case forecasts, upside scenarios, positive variance
- **s4 (red):** Stress scenarios, negative outcomes, unfavorable variance
- **Success green:** Validation checks that pass, positive status
- **Warning yellow/orange:** Caution states, items awaiting confirmation
- **Danger red:** Failures, blocked states, critical issues

### When NOT to Use Color
- Don't rely on color alone to convey meaning — always pair with text, icons, or patterns
- Don't use four data series if only two categories exist — simplify to binary (s1 + s2)
- Don't add new colors — the fixed palette ensures consistency across all pages

## Component Expansion (Future)

As new components are added, maintain these principles:
1. **Palette constraint:** Use only defined colors (no new hex values)
2. **Token reuse:** Layer via `color-mix()` or opacity, never duplicate values
3. **Dual-mode testing:** Test both light and dark themes before shipping
4. **Accessibility first:** Validate all new text colors against background contrast
5. **No dependencies:** Components render in vanilla HTML/CSS/SVG only
6. **System fonts:** Never add web font dependencies (respects offline requirement)

---

**Last updated:** 19/08/2026 (v4.0 — numeric voice, `.tbl-pro`, `.legend-pro`, `.field`)  
**Status:** Documented & validated across all 24 pages and 182 automated checks  
**Maintenance:** CSS changes cascade via `:root` custom properties; no per-component overrides
