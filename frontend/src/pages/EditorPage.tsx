import { useCallback, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import SymbolPalette from '../components/SymbolPalette';
import DiagramCanvas from '../components/DiagramCanvas';
import { useCanvasStore } from '../stores/canvasStore';

function EditorPage() {
  const loggedIn = sessionStorage.getItem('loggedIn') === 'true';
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState('Untitled Diagram');
  const canvasAreaRef = useRef<HTMLDivElement | null>(null);

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

  if (!loggedIn) return <Navigate to="/login" replace />;

  return (
    <div className="d-flex flex-column" style={{ height: '100vh' }}>
      <div className="d-flex align-items-center gap-2 p-2 border-bottom bg-white">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() => navigate('/')}
        >
          ← Back
        </button>
        <input
          type="text"
          className="form-control form-control-sm"
          style={{ maxWidth: 280 }}
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />
        <div className="ms-auto d-flex gap-2">
          <button type="button" className="btn btn-sm btn-outline-secondary" disabled>
            Undo
          </button>
          <button type="button" className="btn btn-sm btn-outline-secondary" disabled>
            Redo
          </button>
          <button type="button" className="btn btn-sm btn-primary" disabled>
            Save
          </button>
        </div>
      </div>
      <div className="d-flex flex-grow-1" style={{ minHeight: 0 }}>
        <SymbolPalette viewportCenter={getViewportCenter} />
        <div ref={canvasAreaRef} className="flex-grow-1 d-flex" style={{ minWidth: 0 }}>
          <DiagramCanvas />
        </div>
      </div>
    </div>
  );
}

export default EditorPage;
