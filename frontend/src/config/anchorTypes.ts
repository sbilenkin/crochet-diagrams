export const AnchorType = {
  STITCH_TOP: 'STITCH_TOP',
  STITCH_BASE: 'STITCH_BASE',
  CHAIN_LEFT: 'CHAIN_LEFT',
  CHAIN_RIGHT: 'CHAIN_RIGHT',
  CHAIN_TOP: 'CHAIN_TOP',
  RING_SLOT: 'RING_SLOT',
  SPACE: 'SPACE',
} as const;

export type AnchorType = (typeof AnchorType)[keyof typeof AnchorType];

const COMPAT: Record<AnchorType, AnchorType[]> = {
  STITCH_BASE: ['STITCH_TOP', 'CHAIN_TOP', 'RING_SLOT', 'SPACE'],
  STITCH_TOP: ['STITCH_BASE'],
  CHAIN_LEFT: ['CHAIN_RIGHT'],
  CHAIN_RIGHT: ['CHAIN_LEFT'],
  CHAIN_TOP: ['STITCH_BASE'],
  RING_SLOT: ['STITCH_BASE'],
  SPACE: ['STITCH_BASE'],
};

export function areTypesCompatible(a: AnchorType, b: AnchorType): boolean {
  return COMPAT[a]?.includes(b) ?? false;
}

const MAX_CONNECTIONS_BY_TYPE: Record<AnchorType, number> = {
  STITCH_TOP: 6,
  CHAIN_TOP: 3,
  RING_SLOT: 1,
  STITCH_BASE: 1,
  CHAIN_LEFT: 1,
  CHAIN_RIGHT: 1,
  SPACE: 1,
};

export function maxConnectionsFor(type: AnchorType): number {
  return MAX_CONNECTIONS_BY_TYPE[type] ?? 1;
}

export function isMultiOccupancy(type: AnchorType): boolean {
  return maxConnectionsFor(type) > 1;
}

// Temporary scaffolding: hide non-essential anchor types so we can polish the
// single-crochet → starting-chain interaction in isolation. Flip the flag to
// false to restore the full anchor system.
export const SIMPLE_CONNECTIONS_MODE = false;

const HIDDEN_IN_SIMPLE_MODE: ReadonlySet<AnchorType> = new Set([
  'STITCH_TOP',
  'SPACE',
  'RING_SLOT',
]);

export function isAnchorTypeVisible(type: AnchorType): boolean {
  if (!SIMPLE_CONNECTIONS_MODE) return true;
  return !HIDDEN_IN_SIMPLE_MODE.has(type);
}
