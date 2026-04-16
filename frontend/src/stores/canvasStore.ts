import { create } from 'zustand';
import type {
  AnchorRef,
  CanvasSymbol,
  Connection,
  SerializedCanvas,
} from '../types/canvas';

interface SymbolMove {
  id: string;
  x: number;
  y: number;
}

interface DragState {
  activeId: string;
  rootX: number;
  rootY: number;
  snapTarget: { dragged: AnchorRef; target: AnchorRef } | null;
}

interface CanvasState {
  symbols: CanvasSymbol[];
  connections: Connection[];
  offsetX: number;
  offsetY: number;
  zoom: number;
  selectedSymbolId: string | null;
  dragState: DragState | null;
  dirty: boolean;

  addSymbol: (type: string, x: number, y: number) => void;
  moveSymbol: (id: string, x: number, y: number) => void;
  moveSymbols: (updates: SymbolMove[]) => void;
  selectSymbol: (id: string | null) => void;
  deleteSymbol: (id: string) => void;
  setViewport: (offsetX: number, offsetY: number, zoom: number) => void;
  clearCanvas: () => void;

  connectSymbols: (a: AnchorRef, b: AnchorRef) => void;
  disconnectAtAnchor: (ref: AnchorRef) => void;
  disconnectAllForSymbol: (symbolId: string) => void;

  setDragState: (state: DragState | null) => void;

  serialize: () => SerializedCanvas;
  loadFromJSON: (data: SerializedCanvas) => void;
  markClean: () => void;
}

function sameAnchor(a: AnchorRef, b: AnchorRef): boolean {
  return a.symbolId === b.symbolId && a.anchor === b.anchor;
}

function connectionTouches(c: Connection, ref: AnchorRef): boolean {
  return sameAnchor(c.from, ref) || sameAnchor(c.to, ref);
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  symbols: [],
  connections: [],
  offsetX: 0,
  offsetY: 0,
  zoom: 1,
  selectedSymbolId: null,
  dragState: null,
  dirty: false,

  addSymbol: (type, x, y) =>
    set((state) => {
      const STEP = 20;
      let nx = x;
      let ny = y;
      while (state.symbols.some((s) => s.x === nx && s.y === ny)) {
        nx += STEP;
        ny += STEP;
      }
      return {
        symbols: [
          ...state.symbols,
          { id: crypto.randomUUID(), type, x: nx, y: ny, rotation: 0 },
        ],
        dirty: true,
      };
    }),

  moveSymbol: (id, x, y) =>
    set((state) => ({
      symbols: state.symbols.map((s) => (s.id === id ? { ...s, x, y } : s)),
      dirty: true,
    })),

  moveSymbols: (updates) =>
    set((state) => {
      if (updates.length === 0) return {};
      const map = new Map(updates.map((u) => [u.id, u]));
      return {
        symbols: state.symbols.map((s) => {
          const u = map.get(s.id);
          return u ? { ...s, x: u.x, y: u.y } : s;
        }),
        dirty: true,
      };
    }),

  selectSymbol: (id) => set({ selectedSymbolId: id }),

  deleteSymbol: (id) =>
    set((state) => ({
      symbols: state.symbols.filter((s) => s.id !== id),
      connections: state.connections.filter(
        (c) => c.from.symbolId !== id && c.to.symbolId !== id,
      ),
      selectedSymbolId:
        state.selectedSymbolId === id ? null : state.selectedSymbolId,
      dirty: true,
    })),

  setViewport: (offsetX, offsetY, zoom) => set({ offsetX, offsetY, zoom }),

  clearCanvas: () =>
    set({
      symbols: [],
      connections: [],
      selectedSymbolId: null,
      dragState: null,
      dirty: true,
    }),

  connectSymbols: (a, b) =>
    set((state) => {
      const filtered = state.connections.filter(
        (c) => !connectionTouches(c, a) && !connectionTouches(c, b),
      );
      return {
        connections: [...filtered, { from: a, to: b }],
        dirty: true,
      };
    }),

  disconnectAtAnchor: (ref) =>
    set((state) => ({
      connections: state.connections.filter((c) => !connectionTouches(c, ref)),
      dirty: true,
    })),

  disconnectAllForSymbol: (symbolId) =>
    set((state) => ({
      connections: state.connections.filter(
        (c) => c.from.symbolId !== symbolId && c.to.symbolId !== symbolId,
      ),
      dirty: true,
    })),

  setDragState: (dragState) => set({ dragState }),

  serialize: () => {
    const { symbols, connections, offsetX, offsetY, zoom } = get();
    return {
      version: 1,
      symbols,
      connections,
      viewport: { offsetX, offsetY, zoom },
    };
  },

  loadFromJSON: (data) => {
    if (data.version !== 1) {
      throw new Error(`Unsupported canvas version: ${data.version}`);
    }
    set({
      symbols: data.symbols ?? [],
      connections: data.connections ?? [],
      offsetX: data.viewport?.offsetX ?? 0,
      offsetY: data.viewport?.offsetY ?? 0,
      zoom: data.viewport?.zoom ?? 1,
      selectedSymbolId: null,
      dragState: null,
      dirty: false,
    });
  },

  markClean: () => set({ dirty: false }),
}));
