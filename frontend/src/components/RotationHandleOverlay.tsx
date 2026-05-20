import { useRef } from 'react';
import { Circle, Group, Line } from 'react-konva';
import type Konva from 'konva';
import { useCanvasStore } from '../stores/canvasStore';
import { CROCHET_SYMBOLS } from '../config/crochetSymbols';

const HANDLE_COLOR = '#0d6efd';
const SNAP_DEG = 15;

function snapAngle(deg: number, free: boolean): number {
  return free ? deg : Math.round(deg / SNAP_DEG) * SNAP_DEG;
}

// Drag handle on the selected stitch: dragging it rigidly rotates the stitch's
// whole connected component (via rotateSymbolBy), snapping to 15° unless Shift.
function RotationHandleOverlay() {
  const symbols = useCanvasStore((s) => s.symbols);
  const selectedId = useCanvasStore((s) => s.selectedSymbolId);
  const dragState = useCanvasStore((s) => s.dragState);
  const lastAngleRef = useRef<number>(0);

  // Hide during positional drags; keep it during our own rotation drag.
  if (dragState && !dragState.rotating) return null;

  const sym = selectedId ? symbols.find((s) => s.id === selectedId) : undefined;
  const def = sym ? CROCHET_SYMBOLS[sym.type] : undefined;
  if (!sym || !def) return null;

  const radius = def.height / 2 + 22; // handle distance above the stitch center
  const restRad = (((sym.rotation ?? 0) - 90) * Math.PI) / 180; // "up" in the stitch's frame
  const hx = sym.x + radius * Math.cos(restRad);
  const hy = sym.y + radius * Math.sin(restRad);

  const onDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    const store = useCanvasStore.getState();
    store.beginHistoryBatch();
    lastAngleRef.current = sym.rotation ?? 0;
    store.setDragState({
      activeId: sym.id,
      rootX: sym.x,
      rootY: sym.y,
      magneticTarget: null,
      snapTarget: null,
      tentativeDetaches: [],
      rotating: true,
    });
  };

  const onDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const free = (e.evt as DragEvent & { shiftKey?: boolean }).shiftKey ?? false;
    // Pointer angle around the pivot; +90 so the "up" rest position maps to the stitch's rotation.
    const pointerDeg =
      (Math.atan2(node.y() - sym.y, node.x() - sym.x) * 180) / Math.PI + 90;
    const targetDeg = snapAngle(pointerDeg, free);
    const delta = targetDeg - lastAngleRef.current;
    if (delta !== 0) {
      useCanvasStore.getState().rotateSymbolBy(sym.id, delta);
      lastAngleRef.current = targetDeg;
    }
    // Pin the handle to its circle at the snapped angle.
    const a = ((targetDeg - 90) * Math.PI) / 180;
    node.position({ x: sym.x + radius * Math.cos(a), y: sym.y + radius * Math.sin(a) });
  };

  const onDragEnd = () => {
    const store = useCanvasStore.getState();
    store.setDragState(null);
    store.commitHistoryBatch();
  };

  return (
    <Group>
      <Line
        points={[sym.x, sym.y, hx, hy]}
        stroke={HANDLE_COLOR}
        strokeWidth={1}
        dash={[3, 3]}
        listening={false}
      />
      <Circle
        x={hx}
        y={hy}
        radius={6}
        fill="#fff"
        stroke={HANDLE_COLOR}
        strokeWidth={2}
        draggable
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
      />
    </Group>
  );
}

export default RotationHandleOverlay;
