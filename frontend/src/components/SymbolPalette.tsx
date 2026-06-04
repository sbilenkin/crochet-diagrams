import { useMemo, useRef, useState } from 'react';
import { SYMBOL_LIST } from '../config/crochetSymbols';
import { useCanvasStore } from '../stores/canvasStore';
import { useCustomSymbolStore } from '../stores/customSymbolStore';
import { useSymbolEditorStore } from '../stores/symbolEditorStore';
import type { CustomSymbolDef, SymbolCategory, SymbolDef } from '../types/canvas';
import ChainBulkAddPopover, { type ChainAddMode } from './ChainBulkAddPopover';

const CATEGORY_ORDER: SymbolCategory[] = ['basic', 'structural', 'advanced'];
const CATEGORY_LABELS: Record<SymbolCategory, string> = {
  basic: 'Basic Stitches',
  structural: 'Structural',
  advanced: 'Advanced',
};

interface Props {
  viewportCenter: () => { x: number; y: number };
}

function SymbolPalette({ viewportCenter }: Props) {
  const addSymbol = useCanvasStore((s) => s.addSymbol);
  const addChainSequence = useCanvasStore((s) => s.addChainSequence);
  const addChainRing = useCanvasStore((s) => s.addChainRing);
  const customSymbols = useCustomSymbolStore((s) => s.symbols);
  const removeCustomSymbol = useCustomSymbolStore((s) => s.remove);
  const openNew = useSymbolEditorStore((s) => s.openNew);
  const openEdit = useSymbolEditorStore((s) => s.openEdit);
  const [chainPopoverOpen, setChainPopoverOpen] = useState(false);
  const [lastChainCount, setLastChainCount] = useState(10);
  const chainBtnRef = useRef<HTMLButtonElement | null>(null);

  const grouped = useMemo(() => {
    const out: Record<SymbolCategory, SymbolDef[]> = {
      basic: [], advanced: [], structural: [],
    };
    for (const def of SYMBOL_LIST) out[def.category].push(def);
    return out;
  }, []);

  const handleClick = (def: SymbolDef) => {
    if (def.key === 'chain') {
      setChainPopoverOpen((open) => !open);
      return;
    }
    const { x, y } = viewportCenter();
    addSymbol(def.key, x, y);
  };

  const handlePlaceCustom = (sym: CustomSymbolDef) => {
    const { x, y } = viewportCenter();
    const canvasStore = useCanvasStore.getState();
    if (!canvasStore.customSymbols.find((s) => s.id === sym.id)) {
      canvasStore.addCustomSymbol(sym);
    }
    addSymbol(`custom:${sym.id}`, x, y);
  };

  const handleDeleteCustom = (sym: CustomSymbolDef) => {
    const canvasStore = useCanvasStore.getState();
    const inUse = canvasStore.symbols.filter((s) => s.type === `custom:${sym.id}`).length;
    const message = inUse > 0
      ? `"${sym.name}" is used ${inUse} time${inUse > 1 ? 's' : ''} in this project. Remove all instances and delete?`
      : `Delete "${sym.name}"?`;
    if (!window.confirm(message)) return;
    if (inUse > 0) canvasStore.deleteCustomSymbol(sym.id);
    void removeCustomSymbol(sym.id);
  };

  const handleChainSubmit = (count: number, mode: ChainAddMode) => {
    const { x, y } = viewportCenter();
    if (mode === 'ring') addChainRing(count, x, y);
    else addChainSequence(count, x, y);
    setLastChainCount(count);
    setChainPopoverOpen(false);
  };

  return (
    <aside
      className="p-3 border-end bg-light"
      style={{ width: 220, flexShrink: 0, overflowY: 'auto', height: '100%' }}
    >
      <h5 className="mb-3">Symbols</h5>
      {CATEGORY_ORDER.map((cat) => (
        <div key={cat} className="mb-3">
          <div className="text-muted small text-uppercase mb-2">
            {CATEGORY_LABELS[cat]}
          </div>
          <div className="d-flex flex-column gap-1">
            {grouped[cat].map((def) => {
              const isChain = def.key === 'chain';
              return (
                <button
                  key={def.key}
                  ref={isChain ? chainBtnRef : undefined}
                  type="button"
                  className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 text-start w-100"
                  onClick={() => handleClick(def)}
                >
                  <img
                    src={def.svgPath}
                    alt=""
                    width={24}
                    height={24}
                    style={{ flexShrink: 0 }}
                  />
                  <span>{def.displayName}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {/* Custom symbols section */}
      <div className="mb-3">
        <div className="text-muted small text-uppercase mb-2">Custom</div>
        <div className="d-flex flex-column gap-1">
          {customSymbols.map((sym) => (
            <div key={sym.id} className="d-flex align-items-center gap-1">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 text-start flex-grow-1"
                style={{ minWidth: 0 }}
                onClick={() => handlePlaceCustom(sym)}
              >
                <svg
                  viewBox="-50 -50 100 100"
                  width={24}
                  height={24}
                  style={{ flexShrink: 0, border: '1px solid #dee2e6', background: '#fff' }}
                >
                  {sym.paths.map((d, i) => (
                    <path key={i} d={d} stroke="black" strokeWidth={2} fill="none" />
                  ))}
                </svg>
                <span className="text-truncate">{sym.name}</span>
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm px-1"
                title="Edit"
                onClick={() => openEdit(sym)}
              >
                ✎
              </button>
              <button
                type="button"
                className="btn btn-outline-danger btn-sm px-1"
                title="Delete"
                onClick={() => handleDeleteCustom(sym)}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 text-start w-100"
            onClick={openNew}
          >
            <span style={{ fontSize: '1rem', lineHeight: 1 }}>+</span>
            <span>New symbol</span>
          </button>
        </div>
      </div>

      {chainPopoverOpen && (
        <ChainBulkAddPopover
          defaultCount={lastChainCount}
          anchorRef={chainBtnRef}
          onSubmit={handleChainSubmit}
          onClose={() => setChainPopoverOpen(false)}
        />
      )}
    </aside>
  );
}

export default SymbolPalette;
