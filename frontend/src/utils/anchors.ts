import { CROCHET_SYMBOLS } from '../config/crochetSymbols';
import type {
  AnchorDef,
  AnchorDirection,
  AnchorRef,
  CanvasSymbol,
  Connection,
} from '../types/canvas';

export const SNAP_THRESHOLD = 18;

export interface WorldAnchor {
  symbolId: string;
  anchor: AnchorDef;
  x: number;
  y: number;
}

export function getSymbolAnchors(symbol: CanvasSymbol): AnchorDef[] {
  return CROCHET_SYMBOLS[symbol.type]?.anchors ?? [];
}

export function anchorWorldPos(
  symbol: Pick<CanvasSymbol, 'x' | 'y'>,
  anchor: AnchorDef,
): { x: number; y: number } {
  return {
    x: symbol.x + anchor.offsetX,
    y: symbol.y + anchor.offsetY,
  };
}

export function getWorldAnchors(symbol: CanvasSymbol): WorldAnchor[] {
  return getSymbolAnchors(symbol).map((a) => ({
    symbolId: symbol.id,
    anchor: a,
    ...anchorWorldPos(symbol, a),
  }));
}

export function areCompatible(
  a: AnchorDirection,
  b: AnchorDirection,
): boolean {
  if (a === 'up' && b === 'down') return true;
  if (a === 'down' && b === 'up') return true;
  if (a === 'left' && b === 'right') return true;
  if (a === 'right' && b === 'left') return true;
  if (a === 'radial' && b === 'down') return true;
  if (a === 'down' && b === 'radial') return true;
  return false;
}

export function isAnchorOccupied(
  connections: Connection[],
  ref: AnchorRef,
): boolean {
  return connections.some(
    (c) =>
      (c.from.symbolId === ref.symbolId && c.from.anchor === ref.anchor) ||
      (c.to.symbolId === ref.symbolId && c.to.anchor === ref.anchor),
  );
}

export interface SnapMatch {
  dragged: AnchorRef;
  target: AnchorRef;
  draggedAnchor: AnchorDef;
  targetAnchor: AnchorDef;
  targetWorld: { x: number; y: number };
}

/**
 * Find the nearest compatible target anchor for a dragged symbol whose CURRENT
 * world position is (draggedX, draggedY). Excludes anchors on the dragged
 * symbol itself and anchors on `excludeIds` (symbols moving as part of the
 * dragged group).
 */
export function findSnapMatch(
  draggedSymbol: CanvasSymbol,
  draggedX: number,
  draggedY: number,
  others: CanvasSymbol[],
  connections: Connection[],
  excludeIds: Set<string>,
): SnapMatch | null {
  const draggedAnchors = getSymbolAnchors(draggedSymbol).map((a) => ({
    anchor: a,
    world: { x: draggedX + a.offsetX, y: draggedY + a.offsetY },
  }));

  let best: SnapMatch | null = null;
  let bestDist = SNAP_THRESHOLD;

  for (const other of others) {
    if (excludeIds.has(other.id)) continue;
    for (const oa of getSymbolAnchors(other)) {
      const ow = anchorWorldPos(other, oa);
      const otherRef: AnchorRef = { symbolId: other.id, anchor: oa.name };
      if (isAnchorOccupied(connections, otherRef)) continue;
      for (const da of draggedAnchors) {
        if (!areCompatible(da.anchor.direction, oa.direction)) continue;
        const draggedRef: AnchorRef = {
          symbolId: draggedSymbol.id,
          anchor: da.anchor.name,
        };
        if (isAnchorOccupied(connections, draggedRef)) continue;
        const dx = da.world.x - ow.x;
        const dy = da.world.y - ow.y;
        const dist = Math.hypot(dx, dy);
        if (dist < bestDist) {
          bestDist = dist;
          best = {
            dragged: draggedRef,
            target: otherRef,
            draggedAnchor: da.anchor,
            targetAnchor: oa,
            targetWorld: ow,
          };
        }
      }
    }
  }
  return best;
}

/** BFS the connection graph starting from rootId, returning all reachable symbol ids (including root). */
export function getConnectedComponent(
  rootId: string,
  connections: Connection[],
): Set<string> {
  const adj = new Map<string, string[]>();
  for (const c of connections) {
    if (!adj.has(c.from.symbolId)) adj.set(c.from.symbolId, []);
    if (!adj.has(c.to.symbolId)) adj.set(c.to.symbolId, []);
    adj.get(c.from.symbolId)!.push(c.to.symbolId);
    adj.get(c.to.symbolId)!.push(c.from.symbolId);
  }
  const visited = new Set<string>([rootId]);
  const queue = [rootId];
  while (queue.length) {
    const id = queue.shift()!;
    for (const n of adj.get(id) ?? []) {
      if (!visited.has(n)) {
        visited.add(n);
        queue.push(n);
      }
    }
  }
  return visited;
}
