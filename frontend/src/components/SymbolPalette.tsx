import { useMemo, useRef, useState } from 'react';
import { SYMBOL_LIST } from '../config/crochetSymbols';
import { useCanvasStore } from '../stores/canvasStore';
import { useCustomSymbolStore } from '../stores/customSymbolStore';
import { useSymbolEditorStore } from '../stores/symbolEditorStore';
import type { SymbolCategory, SymbolDef } from '../types/canvas';
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
  const openNew = useSymbolEditorStore((s) => s.openNew);
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
      style={{ width: 220, overflowY: 'auto', height: '100%' }}
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
            <div
              key={sym.id}
              className="d-flex align-items-center gap-2 px-2 py-1 rounded"
              style={{ fontSize: '0.85rem' }}
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
