import { create } from 'zustand';
import type { CustomSymbolDef } from '../types/canvas';

export type DrawingTool = 'line' | 'curve';

interface SymbolEditorState {
  open: boolean;
  editingId: string | null;
  name: string;
  paths: string[];
  past: string[][];
  future: string[][];
  activeTool: DrawingTool;

  openNew: () => void;
  openEdit: (symbol: CustomSymbolDef) => void;
  close: () => void;
  setName: (name: string) => void;
  setActiveTool: (tool: DrawingTool) => void;
  commitPath: (pathData: string) => void;
  deletePath: (index: number) => void;
  clearCanvas: () => void;
  undo: () => void;
  redo: () => void;
}

const EMPTY: Pick<SymbolEditorState, 'name' | 'paths' | 'past' | 'future' | 'activeTool' | 'editingId'> = {
  editingId: null,
  name: '',
  paths: [],
  past: [],
  future: [],
  activeTool: 'line',
};

export const useSymbolEditorStore = create<SymbolEditorState>((set, get) => ({
  open: false,
  ...EMPTY,

  openNew: () => set({ open: true, ...EMPTY }),

  openEdit: (symbol) =>
    set({
      open: true,
      editingId: symbol.id,
      name: symbol.name,
      paths: symbol.paths,
      past: [],
      future: [],
      activeTool: 'line',
    }),

  close: () => set({ open: false, ...EMPTY }),

  setName: (name) => set({ name }),

  setActiveTool: (activeTool) => set({ activeTool }),

  commitPath: (pathData) => {
    const { paths, past } = get();
    set({ paths: [...paths, pathData], past: [...past, paths], future: [] });
  },

  deletePath: (index) => {
    const { paths, past } = get();
    const next = paths.filter((_, i) => i !== index);
    set({ paths: next, past: [...past, paths], future: [] });
  },

  clearCanvas: () => {
    const { paths, past } = get();
    if (paths.length === 0) return;
    set({ paths: [], past: [...past, paths], future: [] });
  },

  undo: () => {
    const { past, paths, future } = get();
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    set({ paths: prev, past: past.slice(0, -1), future: [paths, ...future] });
  },

  redo: () => {
    const { past, paths, future } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({ paths: next, past: [...past, paths], future: future.slice(1) });
  },
}));
