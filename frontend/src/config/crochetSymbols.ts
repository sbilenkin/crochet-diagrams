import type { AnchorDef, SymbolDef } from '../types/canvas';
import chainSvg from '../assets/symbols/chain.svg';
import slipStitchSvg from '../assets/symbols/slip_stitch.svg';
import singleCrochetSvg from '../assets/symbols/single_crochet.svg';
import halfDoubleSvg from '../assets/symbols/half_double.svg';
import doubleCrochetSvg from '../assets/symbols/double_crochet.svg';
import trebleCrochetSvg from '../assets/symbols/treble_crochet.svg';
import magicRingSvg from '../assets/symbols/magic_ring.svg';
import increaseSvg from '../assets/symbols/increase.svg';
import decreaseSvg from '../assets/symbols/decrease.svg';

function radialAnchors(count: number, radius: number): AnchorDef[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    return {
      name: `slot_${i + 1}`,
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
      { name: 'left', offsetX: -20, offsetY: 0, direction: 'left' },
      { name: 'right', offsetX: 20, offsetY: 0, direction: 'right' },
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
      { name: 'bottom', offsetX: 0, offsetY: 10, direction: 'down' },
      { name: 'top', offsetX: 0, offsetY: -10, direction: 'up' },
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
      { name: 'bottom', offsetX: 0, offsetY: 15, direction: 'down' },
      { name: 'top', offsetX: 0, offsetY: -15, direction: 'up' },
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
      { name: 'bottom', offsetX: 0, offsetY: 20, direction: 'down' },
      { name: 'top', offsetX: 0, offsetY: -20, direction: 'up' },
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
      { name: 'bottom', offsetX: 0, offsetY: 25, direction: 'down' },
      { name: 'top', offsetX: 0, offsetY: -25, direction: 'up' },
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
      { name: 'bottom', offsetX: 0, offsetY: 30, direction: 'down' },
      { name: 'top', offsetX: 0, offsetY: -30, direction: 'up' },
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
  increase: {
    key: 'increase',
    displayName: 'Increase (inc)',
    svgPath: increaseSvg,
    width: 40,
    height: 40,
    category: 'advanced',
    anchors: [
      { name: 'bottom', offsetX: 0, offsetY: 20, direction: 'down' },
      { name: 'top_left', offsetX: -16, offsetY: -20, direction: 'up' },
      { name: 'top_right', offsetX: 16, offsetY: -20, direction: 'up' },
    ],
  },
  decrease: {
    key: 'decrease',
    displayName: 'Decrease (dec)',
    svgPath: decreaseSvg,
    width: 40,
    height: 40,
    category: 'advanced',
    anchors: [
      { name: 'bottom_left', offsetX: -16, offsetY: 20, direction: 'down' },
      { name: 'bottom_right', offsetX: 16, offsetY: 20, direction: 'down' },
      { name: 'top', offsetX: 0, offsetY: -20, direction: 'up' },
    ],
  },
};

export const SYMBOL_LIST: SymbolDef[] = Object.values(CROCHET_SYMBOLS);
