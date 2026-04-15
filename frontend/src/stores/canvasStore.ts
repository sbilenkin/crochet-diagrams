import { create } from 'zustand';
import type { CanvasSymbol, Connection } from '../types/canvas';

interface CanvasState {
  symbols: CanvasSymbol[];
  connections: Connection[];
  offsetX: number;
  offsetY: number;
  zoom: number;
  selectedSymbolId: string | null;

  addSymbol: (type: string, x: number, y: number) => void;
  moveSymbol: (id: string, x: number, y: number) => void;
  selectSymbol: (id: string | null) => void;
  deleteSymbol: (id: string) => void;
  setViewport: (offsetX: number, offsetY: number, zoom: number) => void;
  clearCanvas: () => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  symbols: [],
  connections: [],
  offsetX: 0,
  offsetY: 0,
  zoom: 1,
  selectedSymbolId: null,

  addSymbol: (type, x, y) =>
    set((state) => ({
      symbols: [
        ...state.symbols,
        { id: crypto.randomUUID(), type, x, y, rotation: 0 },
      ],
    })),

  moveSymbol: (id, x, y) =>
    set((state) => ({
      symbols: state.symbols.map((s) => (s.id === id ? { ...s, x, y } : s)),
    })),

  selectSymbol: (id) => set({ selectedSymbolId: id }),

  deleteSymbol: (id) =>
    set((state) => ({
      symbols: state.symbols.filter((s) => s.id !== id),
      connections: state.connections.filter(
        (c) => c.from.symbolId !== id && c.to.symbolId !== id,
      ),
      selectedSymbolId:
        state.selectedSymbolId === id ? null : state.selectedSymbolId,
    })),

  setViewport: (offsetX, offsetY, zoom) => set({ offsetX, offsetY, zoom }),

  clearCanvas: () =>
    set({ symbols: [], connections: [], selectedSymbolId: null }),
}));
