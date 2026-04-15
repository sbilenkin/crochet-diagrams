export interface AnchorDef {
  name: string;
  offsetX: number;
  offsetY: number;
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
}

export interface Connection {
  from: { symbolId: string; anchor: string };
  to: { symbolId: string; anchor: string };
}
