import { AnchorType } from './anchorTypes';

export const ANCHOR_COLORS: Record<AnchorType, string> = {
  [AnchorType.STITCH_TOP]: '#0d6efd',
  [AnchorType.STITCH_BASE]: '#fd7e14',
  [AnchorType.CHAIN_LEFT]: '#198754',
  [AnchorType.CHAIN_RIGHT]: '#198754',
  [AnchorType.CHAIN_TOP]: '#0dcaf0',
  [AnchorType.RING_SLOT]: '#6f42c1',
  [AnchorType.SPACE]: '#6c757d',
};

export const ANCHOR_TYPE_LABELS: Record<AnchorType, string> = {
  [AnchorType.STITCH_TOP]: 'Stitch Top',
  [AnchorType.STITCH_BASE]: 'Stitch Base',
  [AnchorType.CHAIN_LEFT]: 'Chain Left',
  [AnchorType.CHAIN_RIGHT]: 'Chain Right',
  [AnchorType.CHAIN_TOP]: 'Chain Top',
  [AnchorType.RING_SLOT]: 'Ring Slot',
  [AnchorType.SPACE]: 'Space',
};

export const ALL_ANCHOR_TYPES = Object.values(AnchorType);
