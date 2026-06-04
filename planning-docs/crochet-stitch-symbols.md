# Crochet stitch symbol components

All symbols follow the Craft Yarn Council (CYCA) standardized crochet chart symbols.

## Shared conventions

- ViewBox: `0 0 32 48` for tall stitches, `0 0 32 32` for compact/wide symbols
- Default stroke: `stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"`
- Default fill: `none` (stroke-only), except slip stitch which is `fill="currentColor"`
- All components accept a `color` prop defaulting to `var(--color-glyph)`
- Use `currentColor` in SVG so the `color` CSS property drives all strokes and fills

### Base component wrapper pattern

```jsx
const StitchGlyph = ({ type, color = 'var(--color-glyph)', size = 32 }) => {
  const symbols = { chain, slipStitch, scX, scPlus, hdc, dc, tr, dtr, ... };
  const Symbol = symbols[type];
  return (
    <svg style={{ color }} width={size} height={size * 1.5} viewBox="0 0 32 48">
      <Symbol />
    </svg>
  );
};
```

For compact symbols (chain, slip stitch, loop modifiers) use a square viewBox:
```jsx
<svg style={{ color }} width={size} height={size} viewBox="0 0 32 32">
```

---

## Basic stitches

### Chain (ch)
Shape: horizontal oval/ellipse. An elongated eye shape, wider than tall.

```jsx
const Chain = () => (
  <svg viewBox="0 0 32 32" fill="none">
    <ellipse cx="16" cy="16" rx="11" ry="6" stroke="currentColor" strokeWidth="2.5" />
  </svg>
);
```

---

### Slip stitch (sl st)
Shape: small filled dot. No stroke.

```jsx
const SlipStitch = () => (
  <svg viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="4.5" fill="currentColor" />
  </svg>
);
```

---

### Single crochet — X variant (sc, option A)
Shape: X cross. Two diagonal lines crossing at center. This is the more common symbol in US patterns.

```jsx
const ScX = () => (
  <svg viewBox="0 0 32 48" fill="none">
    <line x1="8"  y1="12" x2="24" y2="36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="24" y1="12" x2="8"  y2="36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);
```

---

### Single crochet — plus variant (sc, option B)
Shape: plus sign. One vertical line, one horizontal line crossing at center. Both are CYCA-standard.

```jsx
const ScPlus = () => (
  <svg viewBox="0 0 32 48" fill="none">
    <line x1="16" y1="10" x2="16" y2="38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="6"  y1="24" x2="26" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);
```

---

### Half double crochet (hdc)
Shape: capital T. Long vertical stem with one full-width horizontal bar at the very top.

```jsx
const Hdc = () => (
  <svg viewBox="0 0 32 48" fill="none">
    <line x1="16" y1="8"  x2="16" y2="44" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="5"  y1="12" x2="27" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);
```

---

### Double crochet (dc)
Shape: T with 1 diagonal tick. Full-width top bar, plus one shorter diagonal bar crossing through the stem below the T. Diagonal angles lower-left to upper-right (left end lower, right end higher).

```jsx
const Dc = () => (
  <svg viewBox="0 0 32 48" fill="none">
    <line x1="16" y1="6"  x2="16" y2="44" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="5"  y1="10" x2="27" y2="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    {/* Diagonal tick crossing the stem */}
    <line x1="10" y1="26" x2="22" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);
```

---

### Treble crochet (tr)
Shape: T with 2 diagonal ticks. Same as dc but two diagonal bars crossing the stem, evenly spaced below the T.

```jsx
const Tr = () => (
  <svg viewBox="0 0 32 48" fill="none">
    <line x1="16" y1="5"  x2="16" y2="45" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="5"  y1="9"  x2="27" y2="9"  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="10" y1="23" x2="22" y2="17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="10" y1="31" x2="22" y2="25" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);
```

---

### Double treble crochet (dtr)
Shape: T with 3 diagonal ticks. Same pattern extended to three diagonal bars.

```jsx
const Dtr = () => (
  <svg viewBox="0 0 32 48" fill="none">
    <line x1="16" y1="4"  x2="16" y2="46" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="5"  y1="8"  x2="27" y2="8"  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="10" y1="20" x2="22" y2="14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="10" y1="28" x2="22" y2="22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="10" y1="36" x2="22" y2="30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);
```

---

## Decrease stitches

All decrease stitches share the same visual logic: two or more stitch legs spread at the base and converge at a joined top, with a short horizontal bar at the very top indicating the final stitch height.

### sc2tog
Shape: two diagonal legs spreading downward from a joined point at top, short top bar. Legs angle outward like an inverted V.

```jsx
const Sc2tog = () => (
  <svg viewBox="0 0 32 48" fill="none">
    {/* Two legs spreading from top join point */}
    <line x1="16" y1="12" x2="8"  y2="40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="16" y1="12" x2="24" y2="40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    {/* Short top bar */}
    <line x1="10" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);
```

---

### sc3tog
Shape: three legs spreading from a joined top point and top bar. Center leg goes straight down, outer two angle out.

```jsx
const Sc3tog = () => (
  <svg viewBox="0 0 32 48" fill="none">
    <line x1="16" y1="12" x2="6"  y2="40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="16" y1="12" x2="16" y2="40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="16" y1="12" x2="26" y2="40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="9"  y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);
```

---

### dc2tog
Shape: two legs like sc2tog, but each leg has one diagonal tick crossing it (same tick style as dc). Top bar at join.

```jsx
const Dc2tog = () => (
  <svg viewBox="0 0 32 48" fill="none">
    {/* Left leg */}
    <line x1="16" y1="10" x2="8"  y2="42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    {/* Right leg */}
    <line x1="16" y1="10" x2="24" y2="42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    {/* Top bar */}
    <line x1="10" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    {/* Tick on left leg */}
    <line x1="9"  y1="28" x2="14" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* Tick on right leg */}
    <line x1="18" y1="23" x2="23" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
```

---

### dc3tog
Shape: three legs like sc3tog, each with one diagonal tick. Top bar at join.

```jsx
const Dc3tog = () => (
  <svg viewBox="0 0 32 48" fill="none">
    {/* Three legs */}
    <line x1="16" y1="10" x2="6"  y2="42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="16" y1="10" x2="16" y2="42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="16" y1="10" x2="26" y2="42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    {/* Top bar */}
    <line x1="9"  y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    {/* Tick on left leg */}
    <line x1="7"  y1="28" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* Tick on center leg */}
    <line x1="13" y1="26" x2="19" y2="26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* Tick on right leg */}
    <line x1="20" y1="23" x2="25" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
```

---

## Cluster, puff, and popcorn stitches

These are all tall symbols that look like elongated leaf/pod shapes. The difference is in outline detail.

### 3-dc cluster
Shape: three legs merging at the top into a joined top bar, but the legs are enclosed in an elongated leaf/teardrop outline — the cluster looks like a tall pointed oval with a stem at the bottom and a bar at the top.

```jsx
const Cluster3dc = () => (
  <svg viewBox="0 0 32 48" fill="none">
    {/* Outer leaf shape */}
    <path
      d="M16 44 C8 44 5 32 5 22 C5 14 10 9 16 9 C22 9 27 14 27 22 C27 32 24 44 16 44 Z"
      stroke="currentColor" strokeWidth="2.5" fill="none"
    />
    {/* Top bar */}
    <line x1="10" y1="9" x2="22" y2="9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    {/* Internal division lines suggesting 3 legs */}
    <line x1="16" y1="9" x2="11" y2="38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="16" y1="9" x2="21" y2="38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
```

---

### 3-hdc cluster / puff stitch / bobble
Shape: similar tall oval/pod to the 3-dc cluster but wider and more rounded — like an inflated pod. No internal division lines. Top bar at join.

```jsx
const Puff3hdc = () => (
  <svg viewBox="0 0 32 48" fill="none">
    {/* Wide rounded pod shape */}
    <path
      d="M16 44 C7 44 4 33 4 23 C4 14 9 8 16 8 C23 8 28 14 28 23 C28 33 25 44 16 44 Z"
      stroke="currentColor" strokeWidth="2.5" fill="none"
    />
    {/* Top bar */}
    <line x1="9" y1="8" x2="23" y2="8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);
```

---

### 5-dc popcorn
Shape: wide rounded pod (wider than the cluster/puff), with multiple vertical lines inside suggesting 5 dc stitches gathered together. Resembles a plump seed pod.

```jsx
const Popcorn5dc = () => (
  <svg viewBox="0 0 32 48" fill="none">
    {/* Wide outer pod */}
    <path
      d="M16 44 C6 44 3 32 3 22 C3 13 8 7 16 7 C24 7 29 13 29 22 C29 32 26 44 16 44 Z"
      stroke="currentColor" strokeWidth="2.5" fill="none"
    />
    {/* Top bar */}
    <line x1="8" y1="7" x2="24" y2="7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    {/* 4 internal vertical lines suggesting 5 dc */}
    <line x1="10" y1="10" x2="9"  y2="38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="13" y1="9"  x2="13" y2="40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="16" y1="9"  x2="16" y2="41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="19" y1="9"  x2="19" y2="40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="22" y1="10" x2="23" y2="38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
```

---

## Shell stitch

### 5-dc shell
Shape: five dc symbols fanning out from a shared base point. Each dc has a T-top and one diagonal tick. The fan spreads wide — outer stitches angle at roughly 45° from center.

```jsx
const Shell5dc = () => (
  <svg viewBox="0 0 48 48" fill="none">
    {/* Shared base point at bottom center */}
    {/* Far left dc — steeply angled left */}
    <line x1="24" y1="40" x2="6"  y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="2"  y1="12" x2="10" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="5"  y1="22" x2="10" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* Left-center dc */}
    <line x1="24" y1="40" x2="14" y2="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="10" y1="10" x2="18" y2="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="12" y1="21" x2="17" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* Center dc — straight up */}
    <line x1="24" y1="40" x2="24" y2="8"  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="19" y1="8"  x2="29" y2="8"  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="21" y1="20" x2="27" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* Right-center dc */}
    <line x1="24" y1="40" x2="34" y2="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="30" y1="10" x2="38" y2="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="31" y1="17" x2="36" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* Far right dc */}
    <line x1="24" y1="40" x2="42" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="38" y1="12" x2="46" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="38" y1="18" x2="43" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
```

Note: use `viewBox="0 0 48 48"` for this symbol — it is wider than tall.

---

## Post stitches

### Front post dc (FPdc)
Shape: standard dc T-shape, but the lower portion of the stem curves forward (toward viewer) in a J-hook shape at the base, indicating the post is worked around the front of the stitch below.

```jsx
const FPdc = () => (
  <svg viewBox="0 0 32 48" fill="none">
    {/* Upper stem and T bar */}
    <line x1="16" y1="6"  x2="16" y2="30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="5"  y1="10" x2="27" y2="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    {/* Diagonal tick */}
    <line x1="10" y1="22" x2="22" y2="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    {/* Forward hook curve at base — curves right then down */}
    <path d="M16 30 C16 36 22 38 22 43" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
  </svg>
);
```

---

### Back post dc (BPdc)
Shape: same as FPdc but the hook at the base curves the opposite direction (backward), indicating the post is worked around the back.

```jsx
const BPdc = () => (
  <svg viewBox="0 0 32 48" fill="none">
    {/* Upper stem and T bar */}
    <line x1="16" y1="6"  x2="16" y2="30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="5"  y1="10" x2="27" y2="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    {/* Diagonal tick */}
    <line x1="10" y1="22" x2="22" y2="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    {/* Backward hook curve at base — curves left then down */}
    <path d="M16 30 C16 36 10 38 10 43" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
  </svg>
);
```

---

## Picot

### ch-3 picot
Shape: a small loop or arch sitting at the top of a short stem. Looks like a lollipop — a small rounded loop above a short vertical line.

```jsx
const Picot = () => (
  <svg viewBox="0 0 32 32" fill="none">
    {/* Short stem */}
    <line x1="16" y1="26" x2="16" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    {/* Small loop at top */}
    <path d="M16 18 C10 18 8 10 16 8 C24 10 22 18 16 18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
  </svg>
);
```

---

## Loop modifiers

These small symbols appear at the base of a stitch, not as standalone stitches. Render them at a smaller size (suggest 20×12 or similar).

### Worked in back loop only
Shape: a small arc opening upward (like a shallow U or smile shape).

```jsx
const BackLoopOnly = () => (
  <svg viewBox="0 0 24 16" fill="none">
    <path d="M4 4 C4 12 20 12 20 4" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
  </svg>
);
```

---

### Worked in front loop only
Shape: a small arc opening downward (like an upside-down U or frown shape).

```jsx
const FrontLoopOnly = () => (
  <svg viewBox="0 0 24 16" fill="none">
    <path d="M4 12 C4 4 20 4 20 12" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
  </svg>
);
```

---

## Symbol registry

Export all symbols in a single map for use in the palette and canvas renderer:

```jsx
export const STITCH_SYMBOLS = {
  chain:        { label: 'Chain',              abbr: 'ch',     component: Chain,        viewBox: '32x32' },
  slipStitch:   { label: 'Slip stitch',        abbr: 'sl st',  component: SlipStitch,   viewBox: '32x32' },
  scX:          { label: 'Single crochet (×)', abbr: 'sc',     component: ScX,          viewBox: '32x48' },
  scPlus:       { label: 'Single crochet (+)', abbr: 'sc',     component: ScPlus,       viewBox: '32x48' },
  hdc:          { label: 'Half double',         abbr: 'hdc',    component: Hdc,          viewBox: '32x48' },
  dc:           { label: 'Double',              abbr: 'dc',     component: Dc,           viewBox: '32x48' },
  tr:           { label: 'Treble',              abbr: 'tr',     component: Tr,           viewBox: '32x48' },
  dtr:          { label: 'Double treble',       abbr: 'dtr',    component: Dtr,          viewBox: '32x48' },
  sc2tog:       { label: 'sc2tog',              abbr: 'sc2tog', component: Sc2tog,       viewBox: '32x48' },
  sc3tog:       { label: 'sc3tog',              abbr: 'sc3tog', component: Sc3tog,       viewBox: '32x48' },
  dc2tog:       { label: 'dc2tog',              abbr: 'dc2tog', component: Dc2tog,       viewBox: '32x48' },
  dc3tog:       { label: 'dc3tog',              abbr: 'dc3tog', component: Dc3tog,       viewBox: '32x48' },
  cluster3dc:   { label: '3-dc cluster',        abbr: '3-dc cl',component: Cluster3dc,  viewBox: '32x48' },
  puff3hdc:     { label: 'Puff / bobble',       abbr: 'puff',   component: Puff3hdc,    viewBox: '32x48' },
  popcorn5dc:   { label: '5-dc popcorn',        abbr: 'pop',    component: Popcorn5dc,  viewBox: '32x48' },
  shell5dc:     { label: '5-dc shell',          abbr: 'sh',     component: Shell5dc,    viewBox: '48x48' },
  picot:        { label: 'ch-3 picot',          abbr: 'picot',  component: Picot,       viewBox: '32x32' },
  fpdc:         { label: 'Front post dc',       abbr: 'FPdc',   component: FPdc,        viewBox: '32x48' },
  bpdc:         { label: 'Back post dc',        abbr: 'BPdc',   component: BPdc,        viewBox: '32x48' },
  backLoop:     { label: 'Back loop only',      abbr: 'BLO',    component: BackLoopOnly,viewBox: '24x16' },
  frontLoop:    { label: 'Front loop only',     abbr: 'FLO',    component: FrontLoopOnly,viewBox:'24x16' },
};
```

---

## Notes on sc variants

The CYCA standard lists both the X and plus (+) as valid sc symbols. Implement both and allow the user to choose their preferred variant in settings. Default to the X variant as it is more common in US printed patterns and less likely to be confused with chain.

## Notes on symbol sizing on canvas

When symbols are placed on the canvas they should all render at a consistent perceived height. Because some symbols are taller than others (dtr vs chain), normalize by canvas grid unit rather than pixel size — each symbol should occupy one grid cell regardless of its natural aspect ratio, scaled to fit within that cell with consistent padding.

## Notes on color prop

The `color` prop should flow through to `style={{ color }}` on the SVG element, so `currentColor` in all child elements picks it up. This means per-stitch color coding in future requires only setting this prop — no internal SVG changes needed.
