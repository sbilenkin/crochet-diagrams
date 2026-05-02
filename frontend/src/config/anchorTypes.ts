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
