import type { AnchorDef, SymbolDef } from '../types/canvas';
import { AnchorType } from './anchorTypes';
import chainSvg from '../assets/symbols/chain.svg';
import slipStitchSvg from '../assets/symbols/slip_stitch.svg';
import singleCrochetSvg from '../assets/symbols/single_crochet.svg';
import halfDoubleSvg from '../assets/symbols/half_double.svg';
import doubleCrochetSvg from '../assets/symbols/double_crochet.svg';
import trebleCrochetSvg from '../assets/symbols/treble_crochet.svg';
import doubleTrebleSvg from '../assets/symbols/double_treble.svg';
import magicRingSvg from '../assets/symbols/magic_ring.svg';
import sc2togSvg from '../assets/symbols/sc2tog.svg';
import sc3togSvg from '../assets/symbols/sc3tog.svg';
import dc2togSvg from '../assets/symbols/dc2tog.svg';
import dc3togSvg from '../assets/symbols/dc3tog.svg';

function radialAnchors(count: number, radius: number): AnchorDef[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    return {
      name: `slot_${i + 1}`,
      type: AnchorType.RING_SLOT,
      offsetX: Math.cos(angle) * radius,
      offsetY: Math.sin(angle) * radius,
      direction: 'radial' as const,
    };
  });
}

export const CROCHET_SYMBOLS: Record<string, SymbolDef> = {
  chain: {
    key: 'chain',
    displayName: 'Chain (ch)',
    svgPath: chainSvg,
    width: 40,
    height: 20,
    category: 'basic',
    anchors: [
      { name: 'left', type: AnchorType.CHAIN_LEFT, offsetX: -16, offsetY: 0, direction: 'left' },
      { name: 'right', type: AnchorType.CHAIN_RIGHT, offsetX: 16, offsetY: 0, direction: 'right' },
      { name: 'top', type: AnchorType.CHAIN_TOP, offsetX: 0, offsetY: -7, direction: 'up' },
      { name: 'space', type: AnchorType.SPACE, offsetX: 0, offsetY: -18, direction: 'up' },
    ],
  },
  slip_stitch: {
    key: 'slip_stitch',
    displayName: 'Slip Stitch (sl st)',
    svgPath: slipStitchSvg,
    width: 20,
    height: 20,
    category: 'basic',
    anchors: [
      { name: 'bottom', type: AnchorType.STITCH_BASE, offsetX: 0, offsetY: 10, direction: 'down' },
      { name: 'top', type: AnchorType.STITCH_TOP, offsetX: 0, offsetY: -10, direction: 'up' },
    ],
  },
  single_crochet: {
    key: 'single_crochet',
    displayName: 'Single Crochet (sc)',
    svgPath: singleCrochetSvg,
    width: 30,
    height: 30,
    category: 'basic',
    anchors: [
      { name: 'bottom', type: AnchorType.STITCH_BASE, offsetX: 0, offsetY: 8, direction: 'down' },
      { name: 'top', type: AnchorType.STITCH_TOP, offsetX: 0, offsetY: -8, direction: 'up' },
    ],
  },
  half_double: {
    key: 'half_double',
    displayName: 'Half Double (hdc)',
    svgPath: halfDoubleSvg,
    width: 30,
    height: 40,
    category: 'basic',
    anchors: [
      { name: 'bottom', type: AnchorType.STITCH_BASE, offsetX: 0, offsetY: 20, direction: 'down' },
      { name: 'top', type: AnchorType.STITCH_TOP, offsetX: 0, offsetY: -20, direction: 'up' },
    ],
  },
  double_crochet: {
    key: 'double_crochet',
    displayName: 'Double Crochet (dc)',
    svgPath: doubleCrochetSvg,
    width: 30,
    height: 50,
    category: 'basic',
    anchors: [
      { name: 'bottom', type: AnchorType.STITCH_BASE, offsetX: 0, offsetY: 25, direction: 'down' },
      { name: 'top', type: AnchorType.STITCH_TOP, offsetX: 0, offsetY: -25, direction: 'up' },
    ],
  },
  treble_crochet: {
    key: 'treble_crochet',
    displayName: 'Treble Crochet (tr)',
    svgPath: trebleCrochetSvg,
    width: 30,
    height: 60,
    category: 'basic',
    anchors: [
      { name: 'bottom', type: AnchorType.STITCH_BASE, offsetX: 0, offsetY: 30, direction: 'down' },
      { name: 'top', type: AnchorType.STITCH_TOP, offsetX: 0, offsetY: -30, direction: 'up' },
    ],
  },
  double_treble: {
    key: 'double_treble',
    displayName: 'Double Treble (dtr)',
    svgPath: doubleTrebleSvg,
    width: 30,
    height: 70,
    category: 'basic',
    anchors: [
      { name: 'bottom', type: AnchorType.STITCH_BASE, offsetX: 0, offsetY: 35, direction: 'down' },
      { name: 'top', type: AnchorType.STITCH_TOP, offsetX: 0, offsetY: -35, direction: 'up' },
    ],
  },
  magic_ring: {
    key: 'magic_ring',
    displayName: 'Magic Ring',
    svgPath: magicRingSvg,
    width: 80,
    height: 80,
    category: 'structural',
    anchors: radialAnchors(12, 28),
  },
  sc2tog: {
    key: 'sc2tog',
    displayName: 'sc2tog',
    svgPath: sc2togSvg,
    width: 40,
    height: 40,
    category: 'advanced',
    anchors: [
      { name: 'top', type: AnchorType.STITCH_TOP, offsetX: 0, offsetY: -20, direction: 'up' },
      { name: 'bottom_left', type: AnchorType.STITCH_BASE, offsetX: -10, offsetY: 20, direction: 'down' },
      { name: 'bottom_right', type: AnchorType.STITCH_BASE, offsetX: 10, offsetY: 20, direction: 'down' },
    ],
  },
  sc3tog: {
    key: 'sc3tog',
    displayName: 'sc3tog',
    svgPath: sc3togSvg,
    width: 48,
    height: 40,
    category: 'advanced',
    anchors: [
      { name: 'top', type: AnchorType.STITCH_TOP, offsetX: 0, offsetY: -20, direction: 'up' },
      { name: 'bottom_left', type: AnchorType.STITCH_BASE, offsetX: -18, offsetY: 20, direction: 'down' },
      { name: 'bottom_center', type: AnchorType.STITCH_BASE, offsetX: 0, offsetY: 20, direction: 'down' },
      { name: 'bottom_right', type: AnchorType.STITCH_BASE, offsetX: 18, offsetY: 20, direction: 'down' },
    ],
  },
  dc2tog: {
    key: 'dc2tog',
    displayName: 'dc2tog',
    svgPath: dc2togSvg,
    width: 40,
    height: 50,
    category: 'advanced',
    anchors: [
      { name: 'top', type: AnchorType.STITCH_TOP, offsetX: 0, offsetY: -25, direction: 'up' },
      { name: 'bottom_left', type: AnchorType.STITCH_BASE, offsetX: -10, offsetY: 25, direction: 'down' },
      { name: 'bottom_right', type: AnchorType.STITCH_BASE, offsetX: 10, offsetY: 25, direction: 'down' },
    ],
  },
  dc3tog: {
    key: 'dc3tog',
    displayName: 'dc3tog',
    svgPath: dc3togSvg,
    width: 48,
    height: 50,
    category: 'advanced',
    anchors: [
      { name: 'top', type: AnchorType.STITCH_TOP, offsetX: 0, offsetY: -25, direction: 'up' },
      { name: 'bottom_left', type: AnchorType.STITCH_BASE, offsetX: -18, offsetY: 25, direction: 'down' },
      { name: 'bottom_center', type: AnchorType.STITCH_BASE, offsetX: 0, offsetY: 25, direction: 'down' },
      { name: 'bottom_right', type: AnchorType.STITCH_BASE, offsetX: 18, offsetY: 25, direction: 'down' },
    ],
  },
};

export const SYMBOL_LIST: SymbolDef[] = Object.values(CROCHET_SYMBOLS);
