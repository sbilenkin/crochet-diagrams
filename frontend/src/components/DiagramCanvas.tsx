import { useEffect, useRef, useState } from 'react';
import { Stage, Layer } from 'react-konva';
import type Konva from 'konva';
import { useCanvasStore } from '../stores/canvasStore';
import SymbolNode from './SymbolNode';
import AnchorOverlay from './AnchorOverlay';
import ConnectionOverlay from './ConnectionOverlay';

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 4;

interface Size { width: number; height: number }

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

function DiagramCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const size = useSize(containerRef);

  const symbols = useCanvasStore((s) => s.symbols);
  const selectedSymbolId = useCanvasStore((s) => s.selectedSymbolId);
  const offsetX = useCanvasStore((s) => s.offsetX);
  const offsetY = useCanvasStore((s) => s.offsetY);
  const zoom = useCanvasStore((s) => s.zoom);
  const selectSymbol = useCanvasStore((s) => s.selectSymbol);
  const deleteSymbol = useCanvasStore((s) => s.deleteSymbol);
  const setViewport = useCanvasStore((s) => s.setViewport);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (target && target.isContentEditable) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedSymbolId) {
        e.preventDefault();
        deleteSymbol(selectedSymbolId);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedSymbolId, deleteSymbol]);

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
      style={{ flex: 1, height: '100%', overflow: 'hidden', background: '#fafafa' }}
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
          <AnchorOverlay />
        </Layer>
      </Stage>
    </div>
  );
}

export default DiagramCanvas;
