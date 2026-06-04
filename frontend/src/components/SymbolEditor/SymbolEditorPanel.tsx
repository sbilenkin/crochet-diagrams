import { useState } from 'react';
import { useSymbolEditorStore } from '../../stores/symbolEditorStore';
import { useCustomSymbolStore } from '../../stores/customSymbolStore';
import { ANCHOR_COLORS, ANCHOR_TYPE_LABELS, ALL_ANCHOR_TYPES } from '../../config/anchorColors';
import DrawingCanvas from './DrawingCanvas';

export default function SymbolEditorPanel() {
  const {
    editingId, name, paths, anchors, past, future,
    activeTool, editorMode, pendingAnchorType,
    close, setName, setActiveTool, setEditorMode, setPendingAnchorType,
    clearCanvas, removeAnchor, undo, redo,
  } = useSymbolEditorStore();
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
      const payload = { name: name.trim(), width: 60, height: 60, paths, anchors };
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
      className="d-flex flex-column"
      style={{ width: 340, flexShrink: 0, overflowY: 'auto', background: 'var(--color-panel)' }}
    >
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between p-2" style={{ background: 'var(--color-panel)' }}>
        <span className="fw-semibold small">Symbol Editor</span>
        <div className="d-flex gap-1">
          <button type="button" className="btn btn-sm toolbar-btn" onClick={close}>
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

        {/* Mode toggle */}
        <div className="btn-group btn-group-sm w-100" role="group">
          <button
            type="button"
            className={`btn btn-outline-secondary${editorMode === 'draw' ? ' active' : ''}`}
            onClick={() => setEditorMode('draw')}
          >
            Draw
          </button>
          <button
            type="button"
            className={`btn btn-outline-secondary${editorMode === 'connections' ? ' active' : ''}`}
            onClick={() => setEditorMode('connections')}
          >
            Connections
          </button>
        </div>

        {/* Draw mode toolbar */}
        {editorMode === 'draw' && (
          <div className="d-flex align-items-center gap-1 flex-wrap">
            <div className="btn-group btn-group-sm me-1" role="group">
              <button
                type="button"
                className={`btn btn-outline-secondary${activeTool === 'line' ? ' active' : ''}`}
                onClick={() => setActiveTool('line')}
                title="Line tool: click to place first point, click again to finish"
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
        )}

        {/* Connections mode toolbar */}
        {editorMode === 'connections' && (
          <div className="d-flex flex-column gap-1">
            <div className="d-flex align-items-center gap-1 mb-1">
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
              <span className="text-muted ms-1" style={{ fontSize: '0.75rem' }}>
                Click canvas to place · Click dot to remove
              </span>
            </div>
            <div className="text-muted small mb-1">Anchor type</div>
            <div className="d-flex flex-column gap-1">
              {ALL_ANCHOR_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`btn btn-sm d-flex align-items-center gap-2 text-start${pendingAnchorType === type ? ' btn-secondary' : ' btn-outline-secondary'}`}
                  onClick={() => setPendingAnchorType(type)}
                >
                  <span
                    style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: ANCHOR_COLORS[type], flexShrink: 0,
                      border: '1.5px solid rgba(0,0,0,0.15)',
                    }}
                  />
                  {ANCHOR_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Drawing canvas */}
        <DrawingCanvas />

        {/* Placed anchors list */}
        {anchors.length > 0 && (
          <div>
            <div className="text-muted small mb-1">Placed anchors</div>
            <div className="d-flex flex-column gap-1">
              {anchors.map((a, i) => (
                <div key={i} className="d-flex align-items-center gap-2 px-2 py-1 rounded" style={{ fontSize: '0.8rem', background: 'var(--color-canvas)' }}>
                  <span
                    style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: ANCHOR_COLORS[a.type], flexShrink: 0,
                    }}
                  />
                  <span className="flex-grow-1 text-truncate">{a.name}</span>
                  <button
                    type="button"
                    className="btn-close"
                    style={{ fontSize: '0.6rem' }}
                    onClick={() => removeAnchor(i)}
                    aria-label="Remove anchor"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preview */}
        <div>
          <div className="text-muted small mb-1">Preview (diagram size)</div>
          <svg
            viewBox="-50 -50 100 100"
            width={30}
            height={30}
            style={{ background: 'var(--color-canvas)', borderRadius: 6, display: 'block' }}
          >
            {paths.map((d, i) => (
              <path key={i} d={d} stroke="var(--color-glyph)" strokeWidth={2} fill="none" />
            ))}
          </svg>
        </div>

        {editorMode === 'draw' && activeTool === 'curve' && (
          <div className="text-muted" style={{ fontSize: '0.75rem' }}>
            Curve: click to add points · click last point to finish · click first point (green) to close · Esc to cancel
          </div>
        )}
      </div>
    </aside>
  );
}
