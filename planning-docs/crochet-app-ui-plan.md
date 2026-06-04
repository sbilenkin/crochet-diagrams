# Crochet diagram app — UI redesign plan

## Goal

Redesign the app's visual layer from default white/unstyled to a polished, minimalistic interface using cool pastel colors. The canvas must remain neutral so users can eventually color-code their own stitches. All stitch symbols should be redesigned as bold, iconic SVG glyphs.

---

## Design principles

- **Borderless components** — no visible borders on panels, sidebars, or cards. Separation is achieved through background color differences and spacing alone.
- **Pastel chrome, neutral canvas** — UI surfaces use cool pastel tints; the canvas stays near-white so user-applied stitch colors are never competing with the interface.
- **Bold glyphs** — stitch symbols are single-weight SVG paths, thick enough to read at small sizes, using standard crochet notation conventions.
- **One font** — Nunito (Google Fonts) throughout. Warm, clean, slightly rounded. Weights: 400 body, 500 labels, 600 headings.

---

## Color system

All colors should be defined as CSS custom properties in a single `theme.css` or `tokens.js` file. This is the **first thing to implement** before touching any component.

| Token | Hex | Used for |
|---|---|---|
| `--color-toolbar` | `#DDEEF8` | Top toolbar background |
| `--color-sidebar` | `#E8E4F6` | Stitch palette sidebar background |
| `--color-accent-mint` | `#D4F0E6` | Hover states, active tool highlight |
| `--color-accent-blush` | `#F5E0ED` | Selected item, active stitch card |
| `--color-canvas` | `#F5F5F2` | Canvas background (intentionally neutral) |
| `--color-panel` | `#FFFFFF` | Properties panel, floating menus |
| `--color-text-primary` | `#2C2A3A` | Main text |
| `--color-text-muted` | `#8A8799` | Labels, secondary text |
| `--color-glyph` | `#2C2A3A` | Default stitch symbol color (user-overridable per stitch) |

**Canvas variable note:** `--color-canvas` must remain as a standalone overridable token. When per-stitch color coding is implemented, the canvas background should never be derived from or coupled to any palette color.

---

## Typography

Load from Google Fonts:

```html
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600&display=swap" rel="stylesheet">
```

Apply globally:

```css
body {
  font-family: 'Nunito', sans-serif;
  font-size: 14px;
  color: var(--color-text-primary);
}
```

---

## Component areas

### Top toolbar

- Background: `--color-toolbar` (sky blue tint)
- No border, no shadow
- Icon buttons: transparent background, rounded corners on hover using `--color-accent-mint`
- Active tool: `--color-accent-blush` background on the button
- File / undo / redo on the left; zoom controls on the right
- Tool name shown as a small muted label below active icon

### Stitch palette sidebar

- Background: `--color-sidebar` (lavender tint)
- No border separating it from the canvas — color difference is enough
- Stitch cards: white (`--color-panel`) background, no border, `border-radius: 10px`
- On hover: shift card background to `--color-accent-mint`
- On selected: shift to `--color-accent-blush`
- Stitch glyph displayed centered in the card, label below in muted text

### Canvas

- Background: `--color-canvas`
- Subtle guide dots or grid lines in a slightly darker neutral, very low opacity
- No panel borders should visually touch or overlap the canvas edge
- This area must remain free of any pastel tinting — it is the user's color space

### Properties panel

- Background: `--color-panel` (white)
- Slides in from the right, no border on the canvas-facing edge
- Section groups separated by spacing, not dividers
- Input fields: no full border — bottom line only, or subtle fill on focus
- Labels: 12px, `--color-text-muted`

---

## Stitch symbol redesign

All symbols are SVG paths rendered at a consistent size (recommend `32x48` viewBox for tall symbols, `32x32` for compact ones). One stroke weight throughout: `stroke-width: 2.5`, `stroke-linecap: round`. Fill color defaults to `--color-glyph` and should be overridable per-stitch instance via a `color` prop.

### Symbol specifications

| Stitch | Shape | Description |
|---|---|---|
| **Slip stitch** | Filled dot | Small filled circle (~5px radius), no stroke |
| **Chain** | Plus / cross | Centered horizontal and vertical lines of equal length |
| **Single crochet (sc)** | Double plus | Two full-width horizontal bars centered on the vertical stem, evenly spaced |
| **Half double crochet (hdc)** | Capital T | One full-width horizontal bar at the very top of the vertical stem |
| **Double crochet (dc)** | T + 1 diagonal | Full-width top bar (T), plus one shorter diagonal bar below it (angled ~12° from horizontal, left end higher) |
| **Treble crochet (tr)** | T + 2 diagonals | Full-width top bar, plus two shorter diagonal bars below, evenly spaced, same angle as dc |
| **Double treble (dtr)** | T + 3 diagonals | Full-width top bar, plus three shorter diagonal bars below, evenly spaced, same angle |

**Diagonal bar rules:**
- Shorter than the top T-bar (roughly 70% of the width)
- Consistent angle: approximately 12–15° from horizontal, left end higher than right
- Evenly spaced down the stem below the T crossbar
- Same stroke weight as all other lines

### SVG path reference (32×48 viewBox)

```jsx
// Slip stitch — filled dot
<circle cx="16" cy="24" r="5" fill="currentColor" />

// Chain — plus
<line x1="16" y1="8" x2="16" y2="40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
<line x1="6"  y1="24" x2="26" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />

// sc — plus with bottom bar
<line x1="16" y1="6"  x2="16" y2="44" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
<line x1="6"  y1="24" x2="26" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
<line x1="6"  y1="36" x2="26" y2="36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />

// hdc — capital T
<line x1="16" y1="6"  x2="16" y2="44" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
<line x1="4"  y1="10" x2="28" y2="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />

// dc — T + 1 diagonal
<line x1="16" y1="5"  x2="16" y2="45" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
<line x1="4"  y1="9"  x2="28" y2="9"  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
<line x1="9"  y1="19" x2="23" y2="23" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />

// tr — T + 2 diagonals
<line x1="16" y1="4"  x2="16" y2="46" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
<line x1="4"  y1="8"  x2="28" y2="8"  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
<line x1="9"  y1="17" x2="23" y2="21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
<line x1="9"  y1="26" x2="23" y2="30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />

// dtr — T + 3 diagonals
<line x1="16" y1="4"  x2="16" y2="46" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
<line x1="4"  y1="8"  x2="28" y2="8"  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
<line x1="9"  y1="16" x2="23" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
<line x1="9"  y1="24" x2="23" y2="28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
<line x1="9"  y1="32" x2="23" y2="36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
```

Each symbol should be its own React component accepting a `color` prop that defaults to `var(--color-glyph)`. Use `currentColor` in SVG so the prop flows through naturally:

```jsx
const StitchGlyph = ({ type, color = 'var(--color-glyph)', size = 32 }) => { ... }
```

---

## Implementation order

Work through these in sequence. Complete each stage before starting the next.

1. **Design tokens** — create `theme.css` with all CSS custom properties listed above
2. **Canvas background** — apply `--color-canvas`, set up guide dot/grid overlay at low opacity
3. **Toolbar reskin** — apply `--color-toolbar`, restyle icon buttons (hover/active states)
4. **Sidebar reskin** — apply `--color-sidebar`, restyle stitch cards (white, rounded, hover/active)
5. **Stitch glyph components** — replace all existing stitch symbols with the new SVG components
6. **Properties panel** — apply `--color-panel`, clean up input fields and labels
7. **Hover and active transitions** — add `transition: background 150ms ease` to interactive elements
8. **Custom symbol editor** — style the drawing UI to match the rest of the design system

---

## Future-proofing notes

- The `--color-glyph` token on each stitch instance should eventually be stored in the stitch's data model, not just as a CSS variable, so users can save color-coded diagrams.
- `--color-canvas` should never be auto-derived from any UI palette color. Keep it independent so users can eventually set their own canvas background.
- When building the color picker for stitch color coding, the cool pastel palette makes a good set of defaults to offer, but the picker should accept any color.
