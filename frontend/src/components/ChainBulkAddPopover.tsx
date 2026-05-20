import { useEffect, useRef, useState, type RefObject } from 'react';

export type ChainAddMode = 'row' | 'ring';

interface Props {
  defaultCount: number;
  anchorRef: RefObject<HTMLElement | null>;
  onSubmit: (count: number, mode: ChainAddMode) => void;
  onClose: () => void;
}

const MIN_COUNT = 1;
const MIN_RING = 3;
const MAX_COUNT = 100;

function ChainBulkAddPopover({ defaultCount, anchorRef, onSubmit, onClose }: Props) {
  const [value, setValue] = useState(String(defaultCount));
  const [mode, setMode] = useState<ChainAddMode>('row');
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (rect) setPos({ left: rect.right + 8, top: rect.top });
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [anchorRef]);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('mousedown', onMouseDown);
    return () => window.removeEventListener('mousedown', onMouseDown);
  }, [onClose]);

  const parsed = Number.parseInt(value, 10);
  const minCount = mode === 'ring' ? MIN_RING : MIN_COUNT;
  const valid =
    Number.isFinite(parsed) && parsed >= minCount && parsed <= MAX_COUNT;

  const submit = () => {
    if (!valid) return;
    onSubmit(parsed, mode);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!pos) return null;

  return (
    <div
      ref={cardRef}
      className="bg-white border rounded shadow-sm p-2"
      style={{
        position: 'fixed',
        left: pos.left,
        top: pos.top,
        zIndex: 1050,
        minWidth: 180,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="btn-group btn-group-sm w-100 mb-2" role="group">
        <button
          type="button"
          className={`btn ${mode === 'row' ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setMode('row')}
        >
          Row
        </button>
        <button
          type="button"
          className={`btn ${mode === 'ring' ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setMode('ring')}
        >
          Ring
        </button>
      </div>
      <label className="form-label small mb-1" htmlFor="chain-count-input">
        {mode === 'ring' ? 'Chains in ring (min 3)' : 'Number of chains'}
      </label>
      <div className="d-flex gap-2 align-items-center">
        <input
          ref={inputRef}
          id="chain-count-input"
          type="number"
          className="form-control form-control-sm"
          min={minCount}
          max={MAX_COUNT}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ maxWidth: 80 }}
        />
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={submit}
          disabled={!valid}
        >
          Add
        </button>
      </div>
    </div>
  );
}

export default ChainBulkAddPopover;
