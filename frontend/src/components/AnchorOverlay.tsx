import { Circle, Group, Line } from 'react-konva';
import { useCanvasStore } from '../stores/canvasStore';
import {
  anchorWorldPos,
  getSymbolAnchors,
  isAnchorOccupied,
} from '../utils/anchors';
import type { AnchorRef } from '../types/canvas';

const ANCHOR_RADIUS = 4;

function refMatches(a: AnchorRef, symbolId: string, anchorName: string): boolean {
  return a.symbolId === symbolId && a.anchor === anchorName;
}

function AnchorOverlay() {
  const symbols = useCanvasStore((s) => s.symbols);
  const connections = useCanvasStore((s) => s.connections);
  const selectedId = useCanvasStore((s) => s.selectedSymbolId);
  const dragState = useCanvasStore((s) => s.dragState);

  const draggingId = dragState?.activeId ?? null;
  const magneticTarget = dragState?.magneticTarget ?? null;
  const snapTarget = dragState?.snapTarget ?? null;
  const tentativeDetaches = dragState?.tentativeDetaches ?? [];

  const visibleSymbolIds = new Set<string>();
  if (draggingId) {
    for (const s of symbols) visibleSymbolIds.add(s.id);
  } else if (selectedId) {
    visibleSymbolIds.add(selectedId);
  }

  if (visibleSymbolIds.size === 0 && tentativeDetaches.length === 0) return null;

  // Build a quick lookup of world positions for every anchor we might reference.
  const worldPositions = new Map<string, { x: number; y: number }>();
  for (const sym of symbols) {
    const posSource =
      dragState && dragState.activeId === sym.id
        ? { x: dragState.rootX, y: dragState.rootY }
        : { x: sym.x, y: sym.y };
    for (const anchor of getSymbolAnchors(sym)) {
      worldPositions.set(
        `${sym.id}:${anchor.name}`,
        anchorWorldPos(posSource, anchor),
      );
    }
  }

  const snapLine =
    snapTarget &&
    worldPositions.get(`${snapTarget.dragged.symbolId}:${snapTarget.dragged.anchor}`) &&
    worldPositions.get(`${snapTarget.target.symbolId}:${snapTarget.target.anchor}`)
      ? {
          from: worldPositions.get(
            `${snapTarget.dragged.symbolId}:${snapTarget.dragged.anchor}`,
          )!,
          to: worldPositions.get(
            `${snapTarget.target.symbolId}:${snapTarget.target.anchor}`,
          )!,
        }
      : null;

  return (
    <Group listening={false}>
      {/* Tentative-detach stretch lines */}
      {tentativeDetaches.map((td, i) => {
        const from = worldPositions.get(
          `${td.symbolAnchor.symbolId}:${td.symbolAnchor.anchor}`,
        );
        if (!from) return null;
        return (
          <Line
            key={`detach-${i}`}
            points={[from.x, from.y, td.targetWorld.x, td.targetWorld.y]}
            stroke="#fb923c"
            strokeWidth={1.5}
            dash={[4, 4]}
          />
        );
      })}

      {/* Snap-preview dashed line */}
      {snapLine && (
        <Line
          points={[snapLine.from.x, snapLine.from.y, snapLine.to.x, snapLine.to.y]}
          stroke="#19c37d"
          strokeWidth={1.5}
          dash={[4, 4]}
        />
      )}

      {/* Anchor dots */}
      {symbols.map((sym) => {
        if (!visibleSymbolIds.has(sym.id)) return null;
        return getSymbolAnchors(sym).map((anchor) => {
          const pos = worldPositions.get(`${sym.id}:${anchor.name}`);
          if (!pos) return null;
          const ref: AnchorRef = { symbolId: sym.id, anchor: anchor.name };
          const occupied = isAnchorOccupied(connections, ref);
          const isMagnetic =
            !!magneticTarget &&
            (refMatches(magneticTarget.target, sym.id, anchor.name) ||
              refMatches(magneticTarget.dragged, sym.id, anchor.name));
          const isSnap =
            !!snapTarget &&
            (refMatches(snapTarget.target, sym.id, anchor.name) ||
              refMatches(snapTarget.dragged, sym.id, anchor.name));

          let radius = ANCHOR_RADIUS;
          let fill = occupied ? '#9ca3af' : '#22c55e';
          let shadowBlur = 0;
          if (isSnap) {
            radius = 8;
            fill = '#19c37d';
            shadowBlur = 10;
          } else if (isMagnetic) {
            radius = 7;
            fill = '#19c37d';
            shadowBlur = 8;
          }

          return (
            <Circle
              key={`${sym.id}:${anchor.name}`}
              x={pos.x}
              y={pos.y}
              radius={radius}
              fill={fill}
              stroke="#fff"
              strokeWidth={1}
              shadowColor={shadowBlur > 0 ? '#19c37d' : undefined}
              shadowBlur={shadowBlur}
              shadowOpacity={shadowBlur > 0 ? 0.8 : 0}
            />
          );
        });
      })}
    </Group>
  );
}

export default AnchorOverlay;
