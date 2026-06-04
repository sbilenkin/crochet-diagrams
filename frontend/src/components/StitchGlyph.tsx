import type { ReactNode } from 'react';

const STROKE_PROPS = {
  stroke: 'currentColor',
  strokeWidth: 2.5,
  strokeLinecap: 'round' as const,
};

const GLYPHS: Record<string, { viewBox: string; children: ReactNode }> = {
  slip_stitch: {
    viewBox: '0 0 20 20',
    children: <circle cx="10" cy="10" r="4" fill="currentColor" />,
  },
  chain: {
    // Rounder oval per CYCA: rx:ry ≈ 1.85:1
    viewBox: '0 0 40 20',
    children: (
      <ellipse cx="20" cy="10" rx="13" ry="7" fill="none" stroke="currentColor" strokeWidth={2.5} />
    ),
  },
  single_crochet: {
    viewBox: '0 0 30 30',
    children: (
      <>
        <line x1="15" y1="4" x2="15" y2="26" {...STROKE_PROPS} />
        <line x1="4" y1="15" x2="26" y2="15" {...STROKE_PROPS} />
      </>
    ),
  },
  half_double: {
    viewBox: '0 0 30 40',
    children: (
      <>
        <line x1="15" y1="7" x2="15" y2="37" {...STROKE_PROPS} />
        <line x1="3" y1="7" x2="27" y2="7" {...STROKE_PROPS} />
      </>
    ),
  },
  double_crochet: {
    viewBox: '0 0 30 50',
    children: (
      <>
        <line x1="15" y1="6" x2="15" y2="47" {...STROKE_PROPS} />
        <line x1="3" y1="6" x2="27" y2="6" {...STROKE_PROPS} />
        {/* Diagonal tick: left-low, right-high (CYCA standard) */}
        <line x1="7" y1="22" x2="23" y2="18" {...STROKE_PROPS} />
      </>
    ),
  },
  treble_crochet: {
    viewBox: '0 0 30 60',
    children: (
      <>
        <line x1="15" y1="5" x2="15" y2="57" {...STROKE_PROPS} />
        <line x1="3" y1="5" x2="27" y2="5" {...STROKE_PROPS} />
        {/* Two diagonal ticks: left-low, right-high (CYCA standard) */}
        <line x1="7" y1="19" x2="23" y2="15" {...STROKE_PROPS} />
        <line x1="7" y1="32" x2="23" y2="28" {...STROKE_PROPS} />
      </>
    ),
  },
  double_treble: {
    viewBox: '0 0 30 70',
    children: (
      <>
        <line x1="15" y1="7" x2="15" y2="67" {...STROKE_PROPS} />
        <line x1="3" y1="7" x2="27" y2="7" {...STROKE_PROPS} />
        {/* Three diagonal ticks evenly spaced, left-low right-high */}
        <line x1="7" y1="25" x2="23" y2="19" {...STROKE_PROPS} />
        <line x1="7" y1="40" x2="23" y2="34" {...STROKE_PROPS} />
        <line x1="7" y1="55" x2="23" y2="49" {...STROKE_PROPS} />
      </>
    ),
  },
  magic_ring: {
    viewBox: '0 0 40 40',
    children: (
      <circle cx="20" cy="20" r="14" fill="none" stroke="currentColor" strokeWidth={2.5} />
    ),
  },
  sc2tog: {
    // Two legs from joined top, spreading to two bases. Short top bar.
    viewBox: '0 0 40 40',
    children: (
      <>
        <line x1="20" y1="8" x2="8"  y2="34" {...STROKE_PROPS} />
        <line x1="20" y1="8" x2="32" y2="34" {...STROKE_PROPS} />
        <line x1="13" y1="8" x2="27" y2="8"  {...STROKE_PROPS} />
      </>
    ),
  },
  sc3tog: {
    // Three legs from joined top, spreading to three bases.
    viewBox: '0 0 48 40',
    children: (
      <>
        <line x1="24" y1="8" x2="6"  y2="34" {...STROKE_PROPS} />
        <line x1="24" y1="8" x2="24" y2="34" {...STROKE_PROPS} />
        <line x1="24" y1="8" x2="42" y2="34" {...STROKE_PROPS} />
        <line x1="15" y1="8" x2="33" y2="8"  {...STROKE_PROPS} />
      </>
    ),
  },
  dc2tog: {
    // Two legs + top bar, each leg has a dc-style diagonal tick.
    viewBox: '0 0 40 50',
    children: (
      <>
        <line x1="20" y1="8" x2="8"  y2="44" {...STROKE_PROPS} />
        <line x1="20" y1="8" x2="32" y2="44" {...STROKE_PROPS} />
        <line x1="13" y1="8" x2="27" y2="8"  {...STROKE_PROPS} />
        {/* Tick on left leg: left-low, right-high */}
        <line x1="9"  y1="30" x2="15" y2="24" {...STROKE_PROPS} />
        {/* Tick on right leg: left-high, right-low (mirrors left) */}
        <line x1="25" y1="24" x2="31" y2="30" {...STROKE_PROPS} />
      </>
    ),
  },
  dc3tog: {
    // Three legs + top bar, each leg has a dc-style tick.
    viewBox: '0 0 48 50',
    children: (
      <>
        <line x1="24" y1="8" x2="6"  y2="44" {...STROKE_PROPS} />
        <line x1="24" y1="8" x2="24" y2="44" {...STROKE_PROPS} />
        <line x1="24" y1="8" x2="42" y2="44" {...STROKE_PROPS} />
        <line x1="14" y1="8" x2="34" y2="8"  {...STROKE_PROPS} />
        {/* Tick on left leg */}
        <line x1="10" y1="28" x2="16" y2="22" {...STROKE_PROPS} />
        {/* Tick on center leg (horizontal) */}
        <line x1="20" y1="26" x2="28" y2="26" {...STROKE_PROPS} />
        {/* Tick on right leg */}
        <line x1="32" y1="22" x2="38" y2="28" {...STROKE_PROPS} />
      </>
    ),
  },
};

interface StitchGlyphProps {
  symbolKey: string;
  size?: number;
}

export default function StitchGlyph({ symbolKey, size = 24 }: StitchGlyphProps) {
  const glyph = GLYPHS[symbolKey];
  if (!glyph) return null;
  return (
    <svg
      viewBox={glyph.viewBox}
      width={size}
      height={size}
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      {glyph.children}
    </svg>
  );
}
