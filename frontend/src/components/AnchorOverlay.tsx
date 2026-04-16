import { Circle, Group } from 'react-konva';
import { useCanvasStore } from '../stores/canvasStore';
import {
  anchorWorldPos,
  getSymbolAnchors,
  isAnchorOccupied,
} from '../utils/anchors';

const ANCHOR_RADIUS = 4;

function AnchorOverlay() {
  const symbols = useCanvasStore((s) => s.symbols);
  const connections = useCanvasStore((s) => s.connections);
  const selectedId = useCanvasStore((s) => s.selectedSymbolId);
  const dragState = useCanvasStore((s) => s.dragState);

  const draggingId = dragState?.activeId ?? null;
  const snapTarget = dragState?.snapTarget ?? null;
  // While dragging show all anchors (so user can see snap targets); otherwise only the selected symbol's.
  const visibleSymbolIds = new Set<string>();
  if (draggingId) {
    for (const s of symbols) visibleSymbolIds.add(s.id);
  } else if (selectedId) {
    visibleSymbolIds.add(selectedId);
  }
  if (visibleSymbolIds.size === 0) return null;

  return (
    <Group listening={false}>
      {symbols.map((sym) => {
        if (!visibleSymbolIds.has(sym.id)) return null;
        const posSource =
          dragState && dragState.activeId === sym.id
            ? { x: dragState.rootX, y: dragState.rootY }
            : { x: sym.x, y: sym.y };
        return getSymbolAnchors(sym).map((anchor) => {
          const { x, y } = anchorWorldPos(posSource, anchor);
          const ref = { symbolId: sym.id, anchor: anchor.name };
          const occupied = isAnchorOccupied(connections, ref);
          const isSnapTarget =
            snapTarget &&
            ((snapTarget.target.symbolId === sym.id &&
              snapTarget.target.anchor === anchor.name) ||
              (snapTarget.dragged.symbolId === sym.id &&
                snapTarget.dragged.anchor === anchor.name));
          const fill = isSnapTarget
            ? '#19c37d'
            : occupied
              ? '#9ca3af'
              : '#22c55e';
          return (
            <Circle
              key={`${sym.id}:${anchor.name}`}
              x={x}
              y={y}
              radius={isSnapTarget ? ANCHOR_RADIUS + 2 : ANCHOR_RADIUS}
              fill={fill}
              stroke="#fff"
              strokeWidth={1}
            />
          );
        });
      })}
    </Group>
  );
}

export default AnchorOverlay;
