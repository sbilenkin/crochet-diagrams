import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Stage, Layer } from 'react-konva';
import type Konva from 'konva';
import { useCanvasStore } from '../stores/canvasStore';
import SymbolNode from './SymbolNode';
import AnchorOverlay from './AnchorOverlay';
import ConnectionOverlay from './ConnectionOverlay';
import StartIndicatorOverlay from './StartIndicatorOverlay';
import RotationHandleOverlay from './RotationHandleOverlay';

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 4;

interface Size { width: number; height: number }

export type DiagramCanvasHandle = {
  getStage: () => Konva.Stage | null;
};

function useSize(ref: React.RefObject<HTMLDivElement | null>): Size {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () =>
      setSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

const DiagramCanvas = forwardRef<DiagramCanvasHandle>((_props, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const size = useSize(containerRef);

  useImperativeHandle(ref, () => ({ getStage: () => stageRef.current }), []);

  const symbols = useCanvasStore((s) => s.symbols);
  const selectedSymbolId = useCanvasStore((s) => s.selectedSymbolId);
  const offsetX = useCanvasStore((s) => s.offsetX);
  const offsetY = useCanvasStore((s) => s.offsetY);
  const zoom = useCanvasStore((s) => s.zoom);
  const selectSymbol = useCanvasStore((s) => s.selectSymbol);
  const toggleStart = useCanvasStore((s) => s.toggleStart);
  const rotateSymbolBy = useCanvasStore((s) => s.rotateSymbolBy);
  const deleteSymbol = useCanvasStore((s) => s.deleteSymbol);
  const setViewport = useCanvasStore((s) => s.setViewport);
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (target && target.isContentEditable) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        redo();
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedSymbolId) {
        e.preventDefault();
        deleteSymbol(selectedSymbolId);
        return;
      }
      if ((e.key === 's' || e.key === 'S') && !mod && selectedSymbolId) {
        e.preventDefault();
        toggleStart(selectedSymbolId);
        return;
      }
      if (
        (e.code === 'BracketLeft' || e.code === 'BracketRight') &&
        !mod &&
        selectedSymbolId
      ) {
        e.preventDefault();
        const dir = e.code === 'BracketRight' ? 1 : -1;
        rotateSymbolBy(selectedSymbolId, dir * (e.shiftKey ? 1 : 15));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedSymbolId, deleteSymbol, toggleStart, rotateSymbolBy, undo, redo]);

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const oldScale = zoom;
    const mousePoint = {
      x: (pointer.x - offsetX) / oldScale,
      y: (pointer.y - offsetY) / oldScale,
    };
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const factor = 1.1;
    let newScale = direction > 0 ? oldScale * factor : oldScale / factor;
    newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale));

    const newOffsetX = pointer.x - mousePoint.x * newScale;
    const newOffsetY = pointer.y - mousePoint.y * newScale;
    setViewport(newOffsetX, newOffsetY, newScale);
  };

  const handleStageMouseDown = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    if (e.target === e.target.getStage()) {
      selectSymbol(null);
    }
  };

  const handleStageDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (e.target === e.target.getStage()) {
      setViewport(e.target.x(), e.target.y(), zoom);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        height: '100%',
        overflow: 'hidden',
        background: 'var(--color-canvas)',
        backgroundImage: 'radial-gradient(circle, #c8c7c1 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        x={offsetX}
        y={offsetY}
        scaleX={zoom}
        scaleY={zoom}
        draggable
        onWheel={handleWheel}
        onMouseDown={handleStageMouseDown}
        onTouchStart={handleStageMouseDown}
        onDragEnd={handleStageDragEnd}
      >
        <Layer>
          <ConnectionOverlay />
          {symbols.map((sym) => (
            <SymbolNode
              key={sym.id}
              symbol={sym}
              selected={sym.id === selectedSymbolId}
            />
          ))}
          <StartIndicatorOverlay />
          <AnchorOverlay />
          <RotationHandleOverlay />
        </Layer>
      </Stage>
    </div>
  );
});

DiagramCanvas.displayName = 'DiagramCanvas';

export default DiagramCanvas;
