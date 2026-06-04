import { create } from 'zustand';
import type { CustomSymbolDef } from '../types/canvas';
import {
  listCustomSymbols,
  createCustomSymbol,
  updateCustomSymbol,
  deleteCustomSymbol,
  type CustomSymbolPayload,
} from '../api/customSymbols';

interface CustomSymbolLibraryState {
  symbols: CustomSymbolDef[];
  loaded: boolean;

  load: () => Promise<void>;
  add: (payload: CustomSymbolPayload) => Promise<CustomSymbolDef>;
  update: (id: string, payload: Partial<CustomSymbolPayload>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useCustomSymbolStore = create<CustomSymbolLibraryState>((set) => ({
  symbols: [],
  loaded: false,

  load: async () => {
    const symbols = await listCustomSymbols();
    set({ symbols, loaded: true });
  },

  add: async (payload) => {
    const created = await createCustomSymbol(payload);
    set((state) => ({ symbols: [...state.symbols, created] }));
    return created;
  },

  update: async (id, payload) => {
    const updated = await updateCustomSymbol(id, payload);
    set((state) => ({
      symbols: state.symbols.map((s) => (s.id === id ? updated : s)),
    }));
  },

  remove: async (id) => {
    await deleteCustomSymbol(id);
    set((state) => ({
      symbols: state.symbols.filter((s) => s.id !== id),
    }));
  },
}));
