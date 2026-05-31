import type { AnchorType } from '../config/anchorTypes';

export type AnchorDirection = 'up' | 'down' | 'left' | 'right' | 'radial';

export interface AnchorDef {
  name: string;
  type: AnchorType;
  offsetX: number;
  offsetY: number;
  direction: AnchorDirection;
}

export interface AnchorRef {
  symbolId: string;
  anchor: string;
}

export type SymbolCategory = 'basic' | 'advanced' | 'structural';

export interface SymbolDef {
  key: string;
  displayName: string;
  svgPath: string;
  width: number;
  height: number;
  category: SymbolCategory;
  anchors: AnchorDef[];
}

export interface CanvasSymbol {
  id: string;
  type: string;
  x: number;
  y: number;
  rotation: number;
  /** Chains only. Foundation chains are 'starting'; chains added later are 'regular'.
   *  Undefined (legacy data / non-chain symbols) is treated as 'starting'. */
  chainRole?: 'starting' | 'regular';
  /** True on the single stitch flagged as the diagram's starting point. */
  isStart?: boolean;
}

export interface Connection {
  from: { symbolId: string; anchor: string };
  to: { symbolId: string; anchor: string };
}

export interface CustomSymbolDef {
  id: string;
  name: string;
  width: number;
  height: number;
  paths: string[];
  anchors: AnchorDef[];
}

export interface SerializedCanvas {
  version: 1 | 2 | 3;
  symbols: CanvasSymbol[];
  connections: Connection[];
  viewport?: { offsetX: number; offsetY: number; zoom: number };
  customSymbols?: CustomSymbolDef[];
}
