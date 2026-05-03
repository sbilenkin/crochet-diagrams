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

export interface TentativeDetach {
  symbolAnchor: AnchorRef;
  formerTarget: AnchorRef;
  targetWorld: { x: number; y: number };
}

interface DragState {
  activeId: string;
  rootX: number;
  rootY: number;
  magneticTarget: { dragged: AnchorRef; target: AnchorRef } | null;
  snapTarget: { dragged: AnchorRef; target: AnchorRef } | null;
  tentativeDetaches: TentativeDetach[];
}

interface Snapshot {
  symbols: CanvasSymbol[];
  connections: Connection[];
}

const HISTORY_CAP = 50;

interface CanvasState {
  symbols: CanvasSymbol[];
  connections: Connection[];
  offsetX: number;
  offsetY: number;
  zoom: number;
  selectedSymbolId: string | null;
  dragState: DragState | null;
  dirty: boolean;

  past: Snapshot[];
  future: Snapshot[];
  pendingSnapshot: Snapshot | null;
  batching: boolean;

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

  undo: () => void;
  redo: () => void;
  beginHistoryBatch: () => void;
  commitHistoryBatch: () => void;
  _pushHistory: () => void;

  serialize: () => SerializedCanvas;
  loadFromJSON: (data: SerializedCanvas) => void;
  markClean: () => void;
}

function sameAnchor(a: AnchorRef, b: AnchorRef): boolean {
  return a.symbolId === b.symbolId && a.anchor === b.anchor;
}

function takeSnapshot(state: CanvasState): Snapshot {
  return { symbols: state.symbols, connections: state.connections };
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

  past: [],
  future: [],
  pendingSnapshot: null,
  batching: false,

  _pushHistory: () =>
    set((state) => {
      if (state.batching) return {};
      const snap = takeSnapshot(state);
      const past =
        state.past.length >= HISTORY_CAP
          ? [...state.past.slice(1), snap]
          : [...state.past, snap];
      return { past, future: [] };
    }),

  addSymbol: (type, x, y) => {
    get()._pushHistory();
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
    });
  },

  moveSymbol: (id, x, y) => {
    get()._pushHistory();
    set((state) => ({
      symbols: state.symbols.map((s) => (s.id === id ? { ...s, x, y } : s)),
      dirty: true,
    }));
  },

  moveSymbols: (updates) => {
    if (updates.length === 0) return;
    get()._pushHistory();
    set((state) => {
      const map = new Map(updates.map((u) => [u.id, u]));
      return {
        symbols: state.symbols.map((s) => {
          const u = map.get(s.id);
          return u ? { ...s, x: u.x, y: u.y } : s;
        }),
        dirty: true,
      };
    });
  },

  selectSymbol: (id) => set({ selectedSymbolId: id }),

  deleteSymbol: (id) => {
    get()._pushHistory();
    set((state) => ({
      symbols: state.symbols.filter((s) => s.id !== id),
      connections: state.connections.filter(
        (c) => c.from.symbolId !== id && c.to.symbolId !== id,
      ),
      selectedSymbolId:
        state.selectedSymbolId === id ? null : state.selectedSymbolId,
      dirty: true,
    }));
  },

  setViewport: (offsetX, offsetY, zoom) => set({ offsetX, offsetY, zoom }),

  clearCanvas: () => {
    get()._pushHistory();
    set({
      symbols: [],
      connections: [],
      selectedSymbolId: null,
      dragState: null,
      dirty: true,
    });
  },

  connectSymbols: (a, b) => {
    get()._pushHistory();
    set((state) => {
      const filtered = state.connections.filter(
        (c) => !connectionTouches(c, a) && !connectionTouches(c, b),
      );
      return {
        connections: [...filtered, { from: a, to: b }],
        dirty: true,
      };
    });
  },

  disconnectAtAnchor: (ref) => {
    get()._pushHistory();
    set((state) => ({
      connections: state.connections.filter((c) => !connectionTouches(c, ref)),
      dirty: true,
    }));
  },

  disconnectAllForSymbol: (symbolId) => {
    get()._pushHistory();
    set((state) => ({
      connections: state.connections.filter(
        (c) => c.from.symbolId !== symbolId && c.to.symbolId !== symbolId,
      ),
      dirty: true,
    }));
  },

  setDragState: (dragState) => set({ dragState }),

  beginHistoryBatch: () =>
    set((state) => {
      if (state.batching) return {};
      return {
        batching: true,
        pendingSnapshot: takeSnapshot(state),
        future: [],
      };
    }),

  commitHistoryBatch: () =>
    set((state) => {
      if (!state.batching || !state.pendingSnapshot) {
        return { batching: false, pendingSnapshot: null };
      }
      const pre = state.pendingSnapshot;
      const changed =
        pre.symbols !== state.symbols ||
        pre.connections !== state.connections;
      if (!changed) return { batching: false, pendingSnapshot: null };
      const past =
        state.past.length >= HISTORY_CAP
          ? [...state.past.slice(1), pre]
          : [...state.past, pre];
      return { past, batching: false, pendingSnapshot: null };
    }),

  undo: () =>
    set((state) => {
      if (state.dragState || state.batching || state.past.length === 0) {
        return {};
      }
      const prev = state.past[state.past.length - 1];
      const current = takeSnapshot(state);
      return {
        symbols: prev.symbols,
        connections: prev.connections,
        past: state.past.slice(0, -1),
        future: [...state.future, current],
        selectedSymbolId:
          state.selectedSymbolId &&
          prev.symbols.some((s) => s.id === state.selectedSymbolId)
            ? state.selectedSymbolId
            : null,
        dirty: true,
      };
    }),

  redo: () =>
    set((state) => {
      if (state.dragState || state.batching || state.future.length === 0) {
        return {};
      }
      const next = state.future[state.future.length - 1];
      const current = takeSnapshot(state);
      return {
        symbols: next.symbols,
        connections: next.connections,
        future: state.future.slice(0, -1),
        past: [...state.past, current],
        selectedSymbolId:
          state.selectedSymbolId &&
          next.symbols.some((s) => s.id === state.selectedSymbolId)
            ? state.selectedSymbolId
            : null,
        dirty: true,
      };
    }),

  serialize: () => {
    const { symbols, connections, offsetX, offsetY, zoom } = get();
    return {
      version: 2,
      symbols,
      connections,
      viewport: { offsetX, offsetY, zoom },
    };
  },

  loadFromJSON: (data) => {
    if (data.version !== 1 && data.version !== 2) {
      throw new Error(`Unsupported canvas version: ${data.version}`);
    }
    // v1 and v2 share the same on-disk shape — anchor types live in the
    // registry, not the JSON. v1 silently upgrades to v2 on the next save.
    set({
      symbols: data.symbols ?? [],
      connections: data.connections ?? [],
      offsetX: data.viewport?.offsetX ?? 0,
      offsetY: data.viewport?.offsetY ?? 0,
      zoom: data.viewport?.zoom ?? 1,
      selectedSymbolId: null,
      dragState: null,
      dirty: false,
      past: [],
      future: [],
      pendingSnapshot: null,
      batching: false,
    });
  },

  markClean: () => set({ dirty: false }),
}));
