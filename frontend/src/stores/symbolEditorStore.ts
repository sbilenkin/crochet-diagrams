import { create } from 'zustand';
import type { AnchorDef, AnchorDirection, CustomSymbolDef } from '../types/canvas';
import { AnchorType } from '../config/anchorTypes';

export type DrawingTool = 'line' | 'curve';
export type EditorMode = 'draw' | 'connections';

type EditorSnapshot = { paths: string[]; anchors: AnchorDef[] };

const DEFAULT_DIRECTION: Record<string, AnchorDirection> = {
  [AnchorType.STITCH_TOP]: 'up',
  [AnchorType.STITCH_BASE]: 'down',
  [AnchorType.CHAIN_LEFT]: 'left',
  [AnchorType.CHAIN_RIGHT]: 'right',
  [AnchorType.CHAIN_TOP]: 'up',
  [AnchorType.RING_SLOT]: 'radial',
  [AnchorType.SPACE]: 'up',
};

function snap(paths: string[], anchors: AnchorDef[]): EditorSnapshot {
  return { paths, anchors };
}

interface SymbolEditorState {
  open: boolean;
  editingId: string | null;
  name: string;
  paths: string[];
  anchors: AnchorDef[];
  past: EditorSnapshot[];
  future: EditorSnapshot[];
  activeTool: DrawingTool;
  editorMode: EditorMode;
  pendingAnchorType: AnchorType;

  openNew: () => void;
  openEdit: (symbol: CustomSymbolDef) => void;
  close: () => void;
  setName: (name: string) => void;
  setActiveTool: (tool: DrawingTool) => void;
  setEditorMode: (mode: EditorMode) => void;
  setPendingAnchorType: (type: AnchorType) => void;
  commitPath: (pathData: string) => void;
  deletePath: (index: number) => void;
  clearCanvas: () => void;
  addAnchor: (offsetX: number, offsetY: number) => void;
  removeAnchor: (index: number) => void;
  undo: () => void;
  redo: () => void;
}

const EMPTY_STATE = {
  editingId: null as string | null,
  name: '',
  paths: [] as string[],
  anchors: [] as AnchorDef[],
  past: [] as EditorSnapshot[],
  future: [] as EditorSnapshot[],
  activeTool: 'line' as DrawingTool,
  editorMode: 'draw' as EditorMode,
  pendingAnchorType: AnchorType.STITCH_BASE,
};

export const useSymbolEditorStore = create<SymbolEditorState>((set, get) => ({
  open: false,
  ...EMPTY_STATE,

  openNew: () => set({ open: true, ...EMPTY_STATE }),

  openEdit: (symbol) =>
    set({
      open: true,
      editingId: symbol.id,
      name: symbol.name,
      paths: symbol.paths,
      anchors: symbol.anchors,
      past: [],
      future: [],
      activeTool: 'line',
      editorMode: 'draw',
      pendingAnchorType: AnchorType.STITCH_BASE,
    }),

  close: () => set({ open: false, ...EMPTY_STATE }),

  setName: (name) => set({ name }),

  setActiveTool: (activeTool) => set({ activeTool }),

  setEditorMode: (editorMode) => set({ editorMode }),

  setPendingAnchorType: (pendingAnchorType) => set({ pendingAnchorType }),

  commitPath: (pathData) => {
    const { paths, anchors, past } = get();
    set({ paths: [...paths, pathData], past: [...past, snap(paths, anchors)], future: [] });
  },

  deletePath: (index) => {
    const { paths, anchors, past } = get();
    const next = paths.filter((_, i) => i !== index);
    set({ paths: next, past: [...past, snap(paths, anchors)], future: [] });
  },

  clearCanvas: () => {
    const { paths, anchors, past } = get();
    if (paths.length === 0) return;
    set({ paths: [], past: [...past, snap(paths, anchors)], future: [] });
  },

  addAnchor: (offsetX, offsetY) => {
    const { paths, anchors, past, pendingAnchorType } = get();
    const sameType = anchors.filter((a) => a.type === pendingAnchorType).length;
    const newAnchor: AnchorDef = {
      name: `${pendingAnchorType.toLowerCase()}_${sameType}`,
      type: pendingAnchorType,
      offsetX,
      offsetY,
      direction: (DEFAULT_DIRECTION[pendingAnchorType] ?? 'up') as AnchorDirection,
    };
    set({ anchors: [...anchors, newAnchor], past: [...past, snap(paths, anchors)], future: [] });
  },

  removeAnchor: (index) => {
    const { paths, anchors, past } = get();
    set({ anchors: anchors.filter((_, i) => i !== index), past: [...past, snap(paths, anchors)], future: [] });
  },

  undo: () => {
    const { past, paths, anchors, future } = get();
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    set({
      paths: prev.paths,
      anchors: prev.anchors,
      past: past.slice(0, -1),
      future: [snap(paths, anchors), ...future],
    });
  },

  redo: () => {
    const { past, paths, anchors, future } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({
      paths: next.paths,
      anchors: next.anchors,
      past: [...past, snap(paths, anchors)],
      future: future.slice(1),
    });
  },
}));
