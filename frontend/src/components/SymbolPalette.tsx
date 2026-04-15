import { useMemo } from 'react';
import { SYMBOL_LIST } from '../config/crochetSymbols';
import { useCanvasStore } from '../stores/canvasStore';
import type { SymbolCategory, SymbolDef } from '../types/canvas';

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

  const grouped = useMemo(() => {
    const out: Record<SymbolCategory, SymbolDef[]> = {
      basic: [], advanced: [], structural: [],
    };
    for (const def of SYMBOL_LIST) out[def.category].push(def);
    return out;
  }, []);

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
            {grouped[cat].map((def) => (
              <button
                key={def.key}
                type="button"
                className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 text-start"
                onClick={() => {
                  const { x, y } = viewportCenter();
                  addSymbol(def.key, x, y);
                }}
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
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}

export default SymbolPalette;
