import { memo, useEffect, useRef, useState } from 'react';
import { Group, Image as KonvaImage, Rect } from 'react-konva';
import type Konva from 'konva';
import { CROCHET_SYMBOLS } from '../config/crochetSymbols';
import { useCanvasStore } from '../stores/canvasStore';
import type { CanvasSymbol } from '../types/canvas';
import {
  findSnapMatch,
  getConnectedComponent,
} from '../utils/anchors';

function useHtmlImage(src: string): HTMLImageElement | undefined {
  const [img, setImg] = useState<HTMLImageElement | undefined>(undefined);
  useEffect(() => {
    const image = new window.Image();
    image.src = src;
    const onLoad = () => setImg(image);
    image.addEventListener('load', onLoad);
    return () => image.removeEventListener('load', onLoad);
  }, [src]);
  return img;
}

interface Props {
  symbol: CanvasSymbol;
  selected: boolean;
}

interface DragSession {
  rootStart: { x: number; y: number };
  initialPositions: Map<string, { x: number; y: number }>;
  componentIds: Set<string>;
}

function SymbolNode({ symbol, selected }: Props) {
  const def = CROCHET_SYMBOLS[symbol.type];
  const image = useHtmlImage(def?.svgPath ?? '');
  const sessionRef = useRef<DragSession | null>(null);

  if (!def) return null;
  const { width, height } = def;

  const handleDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    const store = useCanvasStore.getState();
    store.selectSymbol(symbol.id);

    // Shift+drag breaks connections so the user can detach a symbol.
    const shift = (e.evt as DragEvent & { shiftKey?: boolean }).shiftKey;
    if (shift) {
      store.disconnectAllForSymbol(symbol.id);
    }

    const conns = useCanvasStore.getState().connections;
    const componentIds = getConnectedComponent(symbol.id, conns);
    const initialPositions = new Map<string, { x: number; y: number }>();
    for (const s of useCanvasStore.getState().symbols) {
      if (componentIds.has(s.id)) {
        initialPositions.set(s.id, { x: s.x, y: s.y });
      }
    }
    sessionRef.current = {
      rootStart: { x: e.target.x(), y: e.target.y() },
      initialPositions,
      componentIds,
    };
    store.setDragState({
      activeId: symbol.id,
      rootX: e.target.x(),
      rootY: e.target.y(),
      snapTarget: null,
    });
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const session = sessionRef.current;
    if (!session) return;
    const dx = e.target.x() - session.rootStart.x;
    const dy = e.target.y() - session.rootStart.y;

    const store = useCanvasStore.getState();
    // Move siblings in the connected component (not the dragged root — Konva owns its position).
    const updates: Array<{ id: string; x: number; y: number }> = [];
    session.initialPositions.forEach((pos, id) => {
      if (id === symbol.id) return;
      updates.push({ id, x: pos.x + dx, y: pos.y + dy });
    });
    if (updates.length) store.moveSymbols(updates);

    // Snap detection — using the dragged root's current world position.
    const draggedX = e.target.x();
    const draggedY = e.target.y();
    const others = store.symbols;
    const match = findSnapMatch(
      symbol,
      draggedX,
      draggedY,
      others,
      store.connections,
      session.componentIds,
    );
    store.setDragState({
      activeId: symbol.id,
      rootX: draggedX,
      rootY: draggedY,
      snapTarget: match
        ? { dragged: match.dragged, target: match.target }
        : null,
    });
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const session = sessionRef.current;
    sessionRef.current = null;
    const store = useCanvasStore.getState();

    let finalRootX = e.target.x();
    let finalRootY = e.target.y();

    // Re-evaluate snap with final position (drag state may be stale).
    const others = store.symbols;
    const excludeIds = session?.componentIds ?? new Set([symbol.id]);
    const match = findSnapMatch(
      symbol,
      finalRootX,
      finalRootY,
      others,
      store.connections,
      excludeIds,
    );

    if (match) {
      // Align: shift so the dragged anchor lands exactly on the target anchor.
      const desiredAnchorX = match.targetWorld.x;
      const desiredAnchorY = match.targetWorld.y;
      finalRootX = desiredAnchorX - match.draggedAnchor.offsetX;
      finalRootY = desiredAnchorY - match.draggedAnchor.offsetY;
    }

    // Commit final positions for the whole component.
    const updates: Array<{ id: string; x: number; y: number }> = [];
    if (session) {
      const dx = finalRootX - session.rootStart.x;
      const dy = finalRootY - session.rootStart.y;
      session.initialPositions.forEach((pos, id) => {
        updates.push({ id, x: pos.x + dx, y: pos.y + dy });
      });
    } else {
      updates.push({ id: symbol.id, x: finalRootX, y: finalRootY });
    }
    store.moveSymbols(updates);
    // Sync Konva node position with snapped value so it doesn't drift.
    e.target.position({ x: finalRootX, y: finalRootY });

    if (match) {
      store.connectSymbols(match.dragged, match.target);
    }
    store.setDragState(null);
  };

  return (
    <Group
      x={symbol.x}
      y={symbol.y}
      rotation={symbol.rotation}
      draggable
      onClick={(e) => {
        e.cancelBubble = true;
        useCanvasStore.getState().selectSymbol(symbol.id);
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        useCanvasStore.getState().selectSymbol(symbol.id);
      }}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <KonvaImage
        image={image}
        width={width}
        height={height}
        offsetX={width / 2}
        offsetY={height / 2}
      />
      {selected && (
        <Rect
          width={width + 6}
          height={height + 6}
          offsetX={width / 2 + 3}
          offsetY={height / 2 + 3}
          stroke="#0d6efd"
          strokeWidth={1.5}
          dash={[4, 4]}
          listening={false}
        />
      )}
    </Group>
  );
}

export default memo(SymbolNode);
