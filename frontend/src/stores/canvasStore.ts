import { create } from 'zustand';
import type {
  AnchorRef,
  CanvasSymbol,
  Connection,
  SerializedCanvas,
} from '../types/canvas';
import { maxConnectionsFor, type AnchorType } from '../config/anchorTypes';
import {
  getConnectedComponent,
  getSymbolAnchors,
  isTopSideAnchorType,
  relayoutFromMany,
  type RelayoutMove,
} from '../utils/anchors';

interface SymbolMove {
  id: string;
  x: number;
  y: number;
  rotation?: number;
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
  // Set while a rotation-handle drag is in progress (not a positional drag).
  rotating?: boolean;
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
  addChainSequence: (count: number, x: number, y: number) => void;
  moveSymbol: (id: string, x: number, y: number) => void;
  moveSymbols: (updates: SymbolMove[]) => void;
  selectSymbol: (id: string | null) => void;
  toggleStart: (id: string) => void;
  rotateSymbolBy: (id: string, deltaDeg: number) => void;
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

function getAnchorTypeAt(
  symbols: CanvasSymbol[],
  ref: AnchorRef,
): AnchorType | null {
  const sym = symbols.find((s) => s.id === ref.symbolId);
  if (!sym) return null;
  const anchor = getSymbolAnchors(sym).find((a) => a.name === ref.anchor);
  return anchor?.type ?? null;
}

function applyMoves(
  symbols: CanvasSymbol[],
  moves: RelayoutMove[],
): CanvasSymbol[] {
  if (moves.length === 0) return symbols;
  const moveMap = new Map(moves.map((m) => [m.id, m]));
  return symbols.map((s) => {
    const m = moveMap.get(s.id);
    return m ? { ...s, x: m.x, y: m.y, rotation: m.rotation } : s;
  });
}

function topSideRefs(symbol: CanvasSymbol): AnchorRef[] {
  return getSymbolAnchors(symbol)
    .filter((a) => isTopSideAnchorType(a.type))
    .map((a) => ({ symbolId: symbol.id, anchor: a.name }));
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

  addChainSequence: (count, x, y) => {
    if (count < 1) return;
    get()._pushHistory();
    set((state) => {
      const CHAIN_W = 32;
      const startX = x - ((count - 1) * CHAIN_W) / 2;
      const newSymbols: CanvasSymbol[] = [];
      const newConnections: Connection[] = [];
      for (let i = 0; i < count; i++) {
        const id = crypto.randomUUID();
        newSymbols.push({
          id,
          type: 'chain',
          x: startX + i * CHAIN_W,
          y,
          rotation: 0,
          chainRole: 'starting',
        });
        if (i > 0) {
          newConnections.push({
            from: { symbolId: newSymbols[i - 1].id, anchor: 'right' },
            to: { symbolId: id, anchor: 'left' },
          });
        }
      }
      // Auto-assign the diagram start to the first chain, but only if no start
      // exists yet — adding more chains later must not steal an existing start.
      if (!state.symbols.some((s) => s.isStart) && newSymbols.length > 0) {
        newSymbols[0] = { ...newSymbols[0], isStart: true };
      }
      return {
        symbols: [...state.symbols, ...newSymbols],
        connections: [...state.connections, ...newConnections],
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
          if (!u) return s;
          return u.rotation !== undefined
            ? { ...s, x: u.x, y: u.y, rotation: u.rotation }
            : { ...s, x: u.x, y: u.y };
        }),
        dirty: true,
      };
    });
  },

  selectSymbol: (id) => set({ selectedSymbolId: id }),

  toggleStart: (id) => {
    const cur = get().symbols.find((s) => s.id === id);
    if (!cur) return;
    const turningOn = !cur.isStart; // already start → toggle off; else set as start
    get()._pushHistory();
    set((state) => ({
      symbols: state.symbols.map((sym) => {
        if (sym.id === id) return { ...sym, isStart: turningOn };
        // When setting a new start, clear any other current start (one per diagram).
        return turningOn && sym.isStart ? { ...sym, isStart: false } : sym;
      }),
      dirty: true,
    }));
  },

  // Rigidly rotate the whole connected component of `id` by deltaDeg, pivoting
  // around the grabbed stitch's center. _pushHistory no-ops inside a batch, so
  // this serves both discrete keyboard presses and a batched handle drag.
  rotateSymbolBy: (id, deltaDeg) => {
    get()._pushHistory();
    set((state) => {
      const pivot = state.symbols.find((s) => s.id === id);
      if (!pivot) return {};
      const comp = getConnectedComponent(id, state.connections);
      const rad = (deltaDeg * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const px = pivot.x;
      const py = pivot.y;
      return {
        symbols: state.symbols.map((s) => {
          if (!comp.has(s.id)) return s;
          const dx = s.x - px;
          const dy = s.y - py;
          return {
            ...s,
            x: px + dx * cos - dy * sin,
            y: py + dx * sin + dy * cos,
            rotation: (s.rotation ?? 0) + deltaDeg,
          };
        }),
        dirty: true,
      };
    });
  },

  deleteSymbol: (id) => {
    get()._pushHistory();
    set((state) => {
      const parentRefs = new Map<string, AnchorRef>();
      for (const c of state.connections) {
        if (c.from.symbolId === id) {
          const key = `${c.to.symbolId}:${c.to.anchor}`;
          parentRefs.set(key, { symbolId: c.to.symbolId, anchor: c.to.anchor });
        } else if (c.to.symbolId === id) {
          const key = `${c.from.symbolId}:${c.from.anchor}`;
          parentRefs.set(key, {
            symbolId: c.from.symbolId,
            anchor: c.from.anchor,
          });
        }
      }

      const newConnections = state.connections.filter(
        (c) => c.from.symbolId !== id && c.to.symbolId !== id,
      );
      const newSymbols = state.symbols.filter((s) => s.id !== id);
      const moves = relayoutFromMany(
        Array.from(parentRefs.values()),
        newSymbols,
        newConnections,
      );

      return {
        symbols: applyMoves(newSymbols, moves),
        connections: newConnections,
        selectedSymbolId:
          state.selectedSymbolId === id ? null : state.selectedSymbolId,
        dirty: true,
      };
    });
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
      const typeA = getAnchorTypeAt(state.symbols, a);
      const typeB = getAnchorTypeAt(state.symbols, b);

      let filtered = state.connections;
      if (typeA && maxConnectionsFor(typeA) === 1) {
        filtered = filtered.filter((c) => !connectionTouches(c, a));
      }
      if (typeB && maxConnectionsFor(typeB) === 1) {
        filtered = filtered.filter((c) => !connectionTouches(c, b));
      }

      const newConnections = [...filtered, { from: a, to: b }];
      // Only relayout from the parent (top-side) end of the connection. Relaying
      // from a base-side anchor would treat the parent as a child and clobber its
      // rotation (e.g. reset a rotated chain to 0 when an sc is attached to it).
      const startAnchors = [
        { ref: a, type: typeA },
        { ref: b, type: typeB },
      ]
        .filter((e) => e.type != null && isTopSideAnchorType(e.type))
        .map((e) => e.ref);
      const moves = relayoutFromMany(startAnchors, state.symbols, newConnections);

      return {
        connections: newConnections,
        symbols: applyMoves(state.symbols, moves),
        dirty: true,
      };
    });
  },

  disconnectAtAnchor: (ref) => {
    get()._pushHistory();
    set((state) => {
      const severedIds = new Set<string>();
      for (const c of state.connections) {
        if (c.from.symbolId === ref.symbolId && c.from.anchor === ref.anchor) {
          severedIds.add(c.to.symbolId);
        } else if (
          c.to.symbolId === ref.symbolId &&
          c.to.anchor === ref.anchor
        ) {
          severedIds.add(c.from.symbolId);
        }
      }

      const newConnections = state.connections.filter(
        (c) => !connectionTouches(c, ref),
      );

      // Keep rotations as-is: a detached stitch retains its current angle (it's now
      // standalone and freely rotatable). The old reset targeted the *severed other
      // end* — which when detaching a child is its parent — wrongly snapping e.g. a
      // rotated chain back to 0°.
      const startAnchors: AnchorRef[] = [ref];
      for (const id of severedIds) {
        const sym = state.symbols.find((s) => s.id === id);
        if (sym) startAnchors.push(...topSideRefs(sym));
      }

      const moves = relayoutFromMany(
        startAnchors,
        state.symbols,
        newConnections,
      );

      return {
        connections: newConnections,
        symbols: applyMoves(state.symbols, moves),
        dirty: true,
      };
    });
  },

  disconnectAllForSymbol: (symbolId) => {
    get()._pushHistory();
    set((state) => {
      const parentRefs = new Map<string, AnchorRef>();
      for (const c of state.connections) {
        if (c.from.symbolId === symbolId) {
          const key = `${c.to.symbolId}:${c.to.anchor}`;
          parentRefs.set(key, { symbolId: c.to.symbolId, anchor: c.to.anchor });
        } else if (c.to.symbolId === symbolId) {
          const key = `${c.from.symbolId}:${c.from.anchor}`;
          parentRefs.set(key, {
            symbolId: c.from.symbolId,
            anchor: c.from.anchor,
          });
        }
      }

      const newConnections = state.connections.filter(
        (c) => c.from.symbolId !== symbolId && c.to.symbolId !== symbolId,
      );

      const workingSymbols = state.symbols.map((s) =>
        s.id === symbolId ? { ...s, rotation: 0 } : s,
      );

      const startAnchors = Array.from(parentRefs.values());
      const sym = workingSymbols.find((s) => s.id === symbolId);
      if (sym) startAnchors.push(...topSideRefs(sym));

      const moves = relayoutFromMany(
        startAnchors,
        workingSymbols,
        newConnections,
      );

      return {
        connections: newConnections,
        symbols: applyMoves(workingSymbols, moves),
        dirty: true,
      };
    });
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
