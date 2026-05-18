import { useEffect, useRef, useState, type RefObject } from 'react';

interface Props {
  defaultCount: number;
  anchorRef: RefObject<HTMLElement | null>;
  onSubmit: (count: number) => void;
  onClose: () => void;
}

const MIN_COUNT = 1;
const MAX_COUNT = 100;

function ChainBulkAddPopover({ defaultCount, anchorRef, onSubmit, onClose }: Props) {
  const [value, setValue] = useState(String(defaultCount));
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
  const valid =
    Number.isFinite(parsed) && parsed >= MIN_COUNT && parsed <= MAX_COUNT;

  const submit = () => {
    if (!valid) return;
    onSubmit(parsed);
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
      <label className="form-label small mb-1" htmlFor="chain-count-input">
        Number of chains
      </label>
      <div className="d-flex gap-2 align-items-center">
        <input
          ref={inputRef}
          id="chain-count-input"
          type="number"
          className="form-control form-control-sm"
          min={MIN_COUNT}
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
