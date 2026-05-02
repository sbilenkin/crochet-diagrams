import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SymbolPalette from '../components/SymbolPalette';
import DiagramCanvas, { type DiagramCanvasHandle } from '../components/DiagramCanvas';
import SaveIndicator from '../components/SaveIndicator';
import { useCanvasStore } from '../stores/canvasStore';
import { getProject, saveCanvas, updateProject } from '../api/projects';
import { ApiError } from '../api/client';
import { exportPDF, exportPNG, generateThumbnail } from '../utils/export';

const AUTO_SAVE_IDLE_MS = 3000;

function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const canvasAreaRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<DiagramCanvasHandle | null>(null);

  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState('');
  const lastSavedName = useRef('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const dirty = useCanvasStore((s) => s.dirty);
  const hasSymbols = useCanvasStore((s) => s.symbols.length > 0);
  const canUndo = useCanvasStore((s) => s.past.length > 0);
  const canRedo = useCanvasStore((s) => s.future.length > 0);
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);

  useEffect(() => {
    if (!exportOpen) return;
    const onDocClick = () => setExportOpen(false);
    window.addEventListener('click', onDocClick);
    return () => window.removeEventListener('click', onDocClick);
  }, [exportOpen]);

  const getViewportCenter = useCallback(() => {
    const store = useCanvasStore.getState();
    const el = canvasAreaRef.current;
    const w = el?.clientWidth ?? window.innerWidth;
    const h = el?.clientHeight ?? window.innerHeight;
    return {
      x: (w / 2 - store.offsetX) / store.zoom,
      y: (h / 2 - store.offsetY) / store.zoom,
    };
  }, []);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    setLoading(true);
    getProject(projectId)
      .then((data) => {
        if (cancelled) return;
        useCanvasStore.getState().loadFromJSON(data.canvas_json);
        setProjectName(data.name);
        lastSavedName.current = data.name;
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          navigate('/projects', { replace: true });
        } else {
          setSaveError((err as Error).message);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, navigate]);

  const doSave = useCallback(async () => {
    if (!projectId) return;
    setSaving(true);
    setSaveError(null);
    try {
      const stage = canvasRef.current?.getStage();
      const thumbnail = stage ? generateThumbnail(stage) : null;
      await saveCanvas(
        projectId,
        useCanvasStore.getState().serialize(),
        thumbnail ?? undefined,
      );
      useCanvasStore.getState().markClean();
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }, [projectId]);

  const handleExportPNG = useCallback(() => {
    const stage = canvasRef.current?.getStage();
    if (!stage) return;
    exportPNG(stage, projectName || 'diagram');
    setExportOpen(false);
  }, [projectName]);

  const handleExportPDF = useCallback(() => {
    const stage = canvasRef.current?.getStage();
    if (!stage) return;
    exportPDF(stage, projectName || 'diagram');
    setExportOpen(false);
  }, [projectName]);

  // Debounced auto-save: save after dirty && AUTO_SAVE_IDLE_MS of no further changes.
  useEffect(() => {
    if (!dirty || loading || !projectId) return;
    const t = setTimeout(() => {
      void doSave();
    }, AUTO_SAVE_IDLE_MS);
    return () => clearTimeout(t);
  }, [dirty, loading, projectId, doSave]);

  const handleNameBlur = async () => {
    if (!projectId) return;
    const next = projectName.trim();
    if (!next || next === lastSavedName.current) return;
    try {
      await updateProject(projectId, { name: next });
      lastSavedName.current = next;
    } catch (err) {
      setSaveError((err as Error).message);
    }
  };

  return (
    <div className="d-flex flex-column" style={{ height: '100vh' }}>
      <div className="d-flex align-items-center gap-2 p-2 border-bottom bg-white">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() => navigate('/projects')}
        >
          ← Projects
        </button>
        <input
          type="text"
          className="form-control form-control-sm"
          style={{ maxWidth: 280 }}
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          onBlur={handleNameBlur}
          disabled={loading}
        />
        <SaveIndicator saving={saving} dirty={dirty} error={saveError} />
        <div className="ms-auto d-flex gap-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={undo}
            disabled={!canUndo || loading}
            title="Undo (Ctrl+Z)"
          >
            Undo
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={redo}
            disabled={!canRedo || loading}
            title="Redo (Ctrl+Shift+Z)"
          >
            Redo
          </button>
          <div className="position-relative">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={(e) => {
                e.stopPropagation();
                setExportOpen((o) => !o);
              }}
              disabled={loading || !hasSymbols}
              title={hasSymbols ? 'Export diagram' : 'Add symbols first'}
            >
              Export ▾
            </button>
            {exportOpen && (
              <div
                className="position-absolute end-0 mt-1 bg-white border rounded shadow-sm"
                style={{ zIndex: 1050, minWidth: 160 }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="btn btn-sm btn-link w-100 text-start text-decoration-none"
                  onClick={handleExportPNG}
                >
                  Export as PNG
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-link w-100 text-start text-decoration-none"
                  onClick={handleExportPDF}
                >
                  Export as PDF
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={doSave}
            disabled={loading || saving || !dirty}
          >
            Save
          </button>
        </div>
      </div>
      <div className="d-flex flex-grow-1" style={{ minHeight: 0 }}>
        <SymbolPalette viewportCenter={getViewportCenter} />
        <div ref={canvasAreaRef} className="flex-grow-1 d-flex" style={{ minWidth: 0 }}>
          {loading ? (
            <div className="w-100 d-flex align-items-center justify-content-center text-muted">
              Loading project…
            </div>
          ) : (
            <DiagramCanvas ref={canvasRef} />
          )}
        </div>
      </div>
    </div>
  );
}

export default EditorPage;
