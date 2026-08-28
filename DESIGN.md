---
version: 6.0
name: Portfolio-financas-corporativas
description: Executive financial portfolio — a single dark editorial theme, data-visualization-first, for FP&A analysis. Anchored on graphite (#09090f) with one amber accent (#d4a843), a serif display face (Lora) against a humanist sans (Inter) and a monospace numeric voice (JetBrains Mono). Four data series (amber for real/base, red for budget/downside, teal for forecast/upside, violet for stress) and a teal sequential ramp for heat maps. Square corners, hairline borders, flat surfaces. No external dependencies — fonts self-hosted, vanilla CSS, SVG charts, native HTML components. Accessibility-first.
---

## Color System

### Primary Palette

One theme, committed. The interface is dark by design, not by system preference:
the palette below is the whole identity, and `color-scheme: dark` declares it so
native controls follow. The only light rendering is print (see *Print*).

```
page:           #09090f  (background, graphite)
surface:        #10121a  (cards, containers)
surface-2:      #161b27  (secondary surfaces, table headers, hover)
surface-3:      #13161f  (card hover)
ink:            #e6e3db  (primary text, warm off-white)
ink-2:          #a8a49c  (secondary text, body copy)
muted:          #86837a  (tertiary text, labels, column heads)
grid:           #1e2333  (gridlines, table rules)
baseline:       #2a3050  (totals, strong rules, chart baseline)
border:         #1e2333  (all borders — hairline, never a shadow)
neutral-mid:    #161b27
shadow:         0 14px 42px rgba(0,0,0,.18)
```

### Accent Colors

One accent, used with decision. Amber reads as attention without meaning loss —
red is reserved for `--bad`, and in a credit and FP&A portfolio that distinction
has to hold.

```
accent:         #d4a843  (primary action, active nav, focus outline, rules)
accent-ink:     #e2bf68  (link text and hover — lighter, for prose contrast)
```

**Ink on amber is `--page` (#09090f), never white.** White on #d4a843 is 2.2:1
and fails at any size; the page ink is 9.0:1.

### Data Series (Four-Series Palette)
Used across all charts, tables, and financial data visualizations.

```
s1 (Real/Base):            #d4a843  (amber)
s2 (Budget/Downside):      #e05c5c  (red)
s3 (Forecast/Upside):      #2a8c7e  (teal)
s4 (Stress/Unfavorable):   #7c6ae6  (violet)
```

### Status Indicators
```
ok:             #2a8c7e  (success — swatches, borders, left rules)
ok-text:        #5db8aa  (success text — the readable variant)
warn:           #d4a843  (warning; same amber as the accent)
serious:        #d98c54  (serious, orange alert)
bad:            #e05c5c  (failure, red alert)
```

### Sequential Palette (Heat maps, intensity scales)
Runs **dark → light** as value rises, which is the inverse of the blue ramp it
replaced. Anything that reads this ramp must derive direction and ink from the
tokens rather than assume it (see *Heat map ink*).

```
seq-100:        #162624  (lowest)
seq-200:        #1d3935
seq-300:        #245048
seq-400:        #2a6a5e
seq-500:        #2a8c7e  (the teal of s3)
seq-600:        #4ba99a
seq-700:        #72c2b5  (highest)
```

## Typography

### Font Stack
```
--font-display:  'Lora', Georgia, 'Times New Roman', serif        headings, display numbers
--font-sans:     'Inter', system-ui, -apple-system, sans-serif    prose, UI
--font-num:      'JetBrains Mono', ui-monospace, …, monospace     labels, grid figures
```

Three voices, each with a job: a serif for anything that is a *title or a display
figure*, a humanist sans for prose and interface, a monospace for labels, column
heads, periods, tags and every figure inside a data grid.

**Self-hosted, not fetched.** The files live in `assets/fonts/` (variable woff2,
`unicode-range` preserved so a page downloads only the subset it uses — about
117 KB for Latin). This is deliberate: the project publishes that it has no
external dependency and that no page emits a console error, and
`automation/node/verificar_paginas.js` fails the build on either. A Google Fonts
`@import` would break both the moment the network is blocked.

### Typographic Scale

| Role | Size | Weight | Line Height | Letter Spacing | Usage |
|------|------|--------|-------------|----------------|-------|
| h1 | clamp(2.2rem, 5.4vw, 4.65rem) | 600 serif | 1.02 | -0.045em | Page titles, hero headlines |
| h2 | clamp(1.55rem, 2.5vw, 2.25rem) | 600 serif | 1.18 | -0.025em | Section headers |
| h3 | 1.18rem | 600 serif | 1.25 | -0.015em | Subsection headers |
| lead | clamp(1rem, 1.5vw, 1.17rem) | 400 sans | 1.72 | 0 | Introductory paragraphs |
| body | 1rem (16px) | 400 sans | 1.62 | 0 | Body text |
| caption | 0.76rem | 400 sans | 1.5 | 0 | Figure captions, metadata |
| eyebrow | 0.66rem | 600 mono | 1.4 | 0.13em | Section labels, uppercase |
| tag | 0.62rem | 600 mono | 1.4 | 0.08em | Tags, chips, evidence seals |
| nav | 0.66rem | 600 mono | 1.2 | 0.05em | Navigation, header actions |
| code | 0.86em | 400 mono | 1.5 | 0 | Inline code, monospace |

### Font Weights
- **Serif (Lora):** 600 for every heading and display figure. 700 is available but
  unused — at display sizes with tight tracking it closes the counters.
- **Sans (Inter):** 400 body, 500/600 emphasis, 700 only inside amber buttons.
- **Mono (JetBrains Mono):** 500 for column heads and quiet labels, 600 for tags
  and navigation.

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
- Max-width: 1200px
- Margin: 0 auto
- Padding: 0 24px (18px below 760px)

### Shadow System
Depth comes from surface and hairline, not from shadow. Cards carry
`box-shadow: none`; a hovered card shifts its border and background and lifts 2px.

The `--e-1…4` ramp survives for the few things that genuinely float — the chart
tooltip, the document sheet, the sticky table header — as dark ambient shadow:
```
--e-1: 0 1px 2px rgba(0,0,0,.34);     --e-3: 0 10px 32px rgba(0,0,0,.42);
--e-2: 0 4px 14px rgba(0,0,0,.34);    --e-4: 0 18px 52px rgba(0,0,0,.5);
```

## Spacing & Rhythm

Vertical rhythm anchored to **16px base line height (1.55)**.
- Headings: bottom margin varies by size (h1: 0.35em, h2: 0.5em, h3: 0.4em)
- Paragraphs: bottom margin 1em
- Gap patterns: 4px, 6px, 10px, 18px, 20px (multiples of spacing scale)
- Border radius: the register is square. 2px (heat cells, swatches), 3px (tags,
  chips, nav, buttons, inputs), 4px (banners, checks), 5px (cards, panels), 6px
  (code blocks). `--r-full` is 3px, not a pill: **this system has no pills.** A
  true circle (timeline marker, competence seal, legend dot) asks for `50%`
  explicitly rather than reaching for that token.

## Accessibility

### Contrast Validation
All text meets WCAG AA. Measured against `--surface-2` (#161b27), the lightest
background any text sits on:

| token | on page | on surface | on surface-2 |
|---|---|---|---|
| `--ink` #e6e3db | 15.5 | 14.6 | 13.4 |
| `--ink-2` #a8a49c | 8.0 | 7.5 | 6.9 |
| `--muted` #86837a | 5.2 | 4.9 | 4.5 |
| `--accent` #d4a843 | 9.0 | 8.4 | 7.8 |
| `--accent-ink` #e2bf68 | 11.2 | 10.6 | 9.7 |
| `--ok-text` #5db8aa | 8.4 | 7.9 | 7.3 |
| `--bad` #e05c5c | 5.5 | 5.2 | 4.8 |

`--muted` is the one token lifted off the reference design: at its original
#6b6860 it measured 3.1:1 on `--surface-2`, and it dresses column heads, the
footer, figure captions and the resting state of every nav item. #86837a is the
smallest step that clears 4.5:1 everywhere while staying the quietest ink of the
three.

**Ink on amber:** amber fills (primary button, active seal, monogram) take
`--page` as ink — 9.0:1. White would be 2.2:1.

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
--font-num:  'JetBrains Mono', ui-monospace, SFMono-Regular,
             "IBM Plex Mono", Menlo, Consolas, monospace
--num-feat:  tabular-nums slashed-zero
```

Applied via `.num`, and automatically inside `.tbl-pro td.n`, range outputs, and `input[type=number]`. Never applied to prose. The face is self-hosted with the other two, so it still works offline.

**Rule:** every currency amount, rate, ratio, variance, and total inside a data
grid renders in `--font-num`. Every sentence renders in the sans.

**Exception — display figures.** A number set at display scale is a headline, and
it takes the serif: `.hero-num`, `.tile .val`, `.proof .n`, `.capa-stats .st .v`.
The split is by scale, not by content: a figure being *read in a column* wants
monospace alignment; a figure being *read as a statement* wants the display face.
Calculator readouts (`.out .v`, 1.4–1.7rem) stay monospace — they change as the
reader types, and alignment matters more than voice.

## Data Visualization

### Chart Color Palette
Uses the four-series palette (s1, s2, s3, s4) for all charts.
- Real / Base data: s1 (amber)
- Budget / Downside scenarios: s2 (red)
- Forecast / Upside projections: s3 (teal)
- Stress / Unfavorable outcomes: s4 (violet)

### Heat map ink
The sequential ramp runs dark → light. Cell ink is therefore **computed**, not
fixed by index: `core.js` measures the WCAG relative luminance of the resolved
background and picks `#0b0b0b` above 0.179 and `#ffffff` below it. The caption
derives its wording from the same measurement, so it can never claim a direction
the palette does not have. The highlighted cell is outlined in `--accent`, which
is legible against both ends of the ramp.

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

## Theme

There is one theme. `:root` declares `color-scheme: dark` and the full palette;
there is no `prefers-color-scheme` branch and no theme toggle. A committed
register is the point — the design reads as a decision rather than as two
half-designs, and every token has exactly one value to reason about.

### Print
Print is the single exception, and it is not a second theme: `@media print`
re-declares the tokens light so a résumé, a cover letter or a study prints on
white paper in black ink. Site chrome (header, footer, controls, toolbars) is
hidden. The document sheet loses its border, radius and shadow and prints
edge-to-edge on A4; section labels print in near-black and bullet marks in a
darkened amber (#7a5f1c) that holds 4.5:1 on white.

## Usage Guidelines

### When to Use Each Color
- **Accent (#d4a843 amber):** Primary CTAs, active navigation, link text, focus outlines, the one accented word in a display headline
- **s1 (amber):** Real data, actuals, baseline scenarios in charts
- **s2 (red):** Budget data, conservative forecasts, downside scenarios
- **s3 (teal):** Best-case forecasts, upside scenarios, positive variance
- **s4 (violet):** Stress scenarios, negative outcomes, unfavorable variance
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
3. **Screen and print:** Test the component on screen and under `@media print` before shipping
4. **Accessibility first:** Validate all new text colors against background contrast (4.5:1 minimum against `--surface-2`)
5. **No dependencies:** Components render in vanilla HTML/CSS/SVG only
6. **Self-hosted fonts:** Never fetch a font at runtime — the three faces in `assets/fonts/` are the whole type system, and a network request would break the offline and console-error guarantees

---

## Editorial Layer (v5.0)

The cover borrows its *grammar* from an editorial design portfolio — brutal scale contrast, numbered section markers, a monochrome portrait layered with type, one decisive accent, composition that bleeds past the container. It deliberately does **not** borrow that reference's costume: brush-script display type and hot red would wreck the credibility this site spends every other page building, and in a finance interface red already means loss (`--bad`). Register is not decoration; the wrong one costs the interview.

### Display scale
```
--d-1: clamp(2.5rem, 1.7rem + 3.4vw, 4.4rem)   cover headline
--d-2: clamp(1.9rem, 1.35rem + 2.4vw, 3rem)    secondary covers
--d-3: clamp(1.15rem, 1.02rem + .7vw, 1.55rem) thesis line under a display
--track-display: -.045em    --track-meta: .22em
```

**Rule:** display scale demands few words. A full sentence at `--d-1` fills the viewport and pushes every proof below the fold — the cover headline is three or four words, and the thesis goes on the line beneath it at `--d-3`.

**Accent on one word only** (`.em`): a background highlight, never an underline. Underlining display type makes readers try to click it.

### Section markers (`.sec-mark`)
`01 / SECTION NAME` above a 2px rule — how an institutional report organises itself, and it gives a scanning reader a spine. Numbers are literal in the HTML so they survive translation.

### Portrait (`.retrato`)
High-contrast monochrome via CSS filter, not baked into the file — one image serves both themes and can be swapped without re-editing. An accent plate offset behind it supplies depth. While no photo exists the slot renders a typographic fallback; it never fabricates a face. Swap instructions live in `assets/img/LEIA-ME.md`.

### Motion
Reading-progress bar, staggered reveal (`.stagger`), count-up on cover figures, contained parallax (±14px) on the portrait, lift on hover (`.lift`). All of it is ornament: every one is disabled under `prefers-reduced-motion`, and no content depends on any of it. Count-up writes the final value into the HTML first, so a reader without IntersectionObserver still sees the number.

---

**Last updated:** 24/08/2026 (v6.0 — dark editorial theme: graphite and amber, Lora/Inter/JetBrains Mono self-hosted, square register, single theme)  
**Status:** Documented & validated across all 25 pages and 194 automated checks  
**Status:** Documented & validated across all 26 pages and 199 automated checks  
**Maintenance:** CSS changes cascade via `:root` custom properties; no per-component overrides
