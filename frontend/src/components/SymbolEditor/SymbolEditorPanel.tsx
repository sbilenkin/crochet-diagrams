import { useState } from 'react';
import { useSymbolEditorStore } from '../../stores/symbolEditorStore';
import { useCustomSymbolStore } from '../../stores/customSymbolStore';
import DrawingCanvas from './DrawingCanvas';

export default function SymbolEditorPanel() {
  const { editingId, name, paths, past, future, activeTool, close, setName, setActiveTool, clearCanvas, undo, redo } =
    useSymbolEditorStore();
  const { add, update } = useCustomSymbolStore();

  const [nameError, setNameError] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    setSaving(true);
    try {
      const payload = { name: name.trim(), width: 100, height: 100, paths, anchors: [] };
      if (editingId) {
        await update(editingId, payload);
      } else {
        await add(payload);
      }
      close();
    } finally {
      setSaving(false);
    }
  }

  return (
    <aside
      className="border-start bg-light d-flex flex-column"
      style={{ width: 340, flexShrink: 0, overflowY: 'auto' }}
    >
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between p-2 border-bottom bg-white">
        <span className="fw-semibold small">Symbol Editor</span>
        <div className="d-flex gap-1">
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={close}>
            Cancel
          </button>
          <button type="button" className="btn btn-sm btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : editingId ? 'Update' : 'Save'}
          </button>
        </div>
      </div>

      <div className="p-2 d-flex flex-column gap-2">
        {/* Name */}
        <div>
          <input
            type="text"
            className={`form-control form-control-sm${nameError ? ' is-invalid' : ''}`}
            placeholder="Symbol name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (e.target.value.trim()) setNameError(false);
            }}
          />
          {nameError && <div className="invalid-feedback d-block">Name is required.</div>}
        </div>

        {/* Tools */}
        <div className="d-flex align-items-center gap-1 flex-wrap">
          <div className="btn-group btn-group-sm me-1" role="group">
            <button
              type="button"
              className={`btn btn-outline-secondary${activeTool === 'line' ? ' active' : ''}`}
              onClick={() => setActiveTool('line')}
              title="Line tool: click and drag"
            >
              Line
            </button>
            <button
              type="button"
              className={`btn btn-outline-secondary${activeTool === 'curve' ? ' active' : ''}`}
              onClick={() => setActiveTool('curve')}
              title="Curve tool: three clicks — start, control point, end"
            >
              Curve
            </button>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={undo}
            disabled={past.length === 0}
            title="Undo"
          >
            ↩
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={redo}
            disabled={future.length === 0}
            title="Redo"
          >
            ↪
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={clearCanvas}
            disabled={paths.length === 0}
            title="Clear canvas"
          >
            Clear
          </button>
        </div>

        {/* Drawing canvas */}
        <DrawingCanvas />

        {/* Preview */}
        <div>
          <div className="text-muted small mb-1">Preview (diagram size)</div>
          <svg
            viewBox="-50 -50 100 100"
            width={30}
            height={30}
            style={{ border: '1px solid #dee2e6', background: '#fff', display: 'block' }}
          >
            {paths.map((d, i) => (
              <path key={i} d={d} stroke="black" strokeWidth={2} fill="none" />
            ))}
          </svg>
        </div>

        {activeTool === 'curve' && (
          <div className="text-muted" style={{ fontSize: '0.75rem' }}>
            Curve: click start → click control point → click end
          </div>
        )}
      </div>
    </aside>
  );
}
