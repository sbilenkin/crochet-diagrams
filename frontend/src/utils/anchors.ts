import { CROCHET_SYMBOLS } from '../config/crochetSymbols';
import {
  areTypesCompatible,
  isAnchorTypeVisible,
  maxConnectionsFor,
  AnchorType,
} from '../config/anchorTypes';
import type {
  AnchorDef,
  AnchorRef,
  CanvasSymbol,
  Connection,
} from '../types/canvas';

export const MAGNETIC_ZONE = 40;
export const SNAP_ZONE = 15;
export const DETACH_THRESHOLD = 40;
export const SNAP_ANIM_MS = 180;
export const MAGNETIC_BIAS = 0.15;

export interface WorldAnchor {
  symbolId: string;
  anchor: AnchorDef;
  x: number;
  y: number;
}

export function chainRole(symbol: CanvasSymbol): 'starting' | 'regular' {
  return symbol.chainRole ?? 'starting'; // legacy/undefined → starting
}

function isAnchorVisibleForSymbol(
  symbol: CanvasSymbol,
  anchor: AnchorDef,
): boolean {
  // Chain-space (SPACE) is offered only by regular chains; starting chains never
  // offer it. This intentionally overrides SIMPLE_CONNECTIONS_MODE for regular chains.
  if (symbol.type === 'chain' && anchor.type === AnchorType.SPACE) {
    return chainRole(symbol) === 'regular';
  }
  return isAnchorTypeVisible(anchor.type);
}

export function getSymbolAnchors(symbol: CanvasSymbol): AnchorDef[] {
  const all = CROCHET_SYMBOLS[symbol.type]?.anchors ?? [];
  return all.filter((a) => isAnchorVisibleForSymbol(symbol, a));
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

export function countConnectionsAt(
  connections: Connection[],
  ref: AnchorRef,
): number {
  let count = 0;
  for (const c of connections) {
    if (c.from.symbolId === ref.symbolId && c.from.anchor === ref.anchor) count++;
    else if (c.to.symbolId === ref.symbolId && c.to.anchor === ref.anchor) count++;
  }
  return count;
}

export function isAnchorAtCapacity(
  connections: Connection[],
  ref: AnchorRef,
  anchorType: AnchorType,
): boolean {
  return countConnectionsAt(connections, ref) >= maxConnectionsFor(anchorType);
}

export interface SnapMatch {
  dragged: AnchorRef;
  target: AnchorRef;
  draggedAnchor: AnchorDef;
  targetAnchor: AnchorDef;
  targetWorld: { x: number; y: number };
  distance: number;
  zone: 'snap' | 'magnetic';
}

/**
 * Find the nearest compatible target anchor within MAGNETIC_ZONE of the dragged
 * symbol's anchors. Tags the result as 'snap' if within SNAP_ZONE, else 'magnetic'.
 * Excludes anchors on the dragged symbol itself and anchors on `excludeIds`
 * (symbols moving as part of the dragged group).
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
  let bestDistSq = MAGNETIC_ZONE * MAGNETIC_ZONE;

  for (const other of others) {
    if (excludeIds.has(other.id)) continue;
    for (const oa of getSymbolAnchors(other)) {
      const ow = anchorWorldPos(other, oa);
      const otherRef: AnchorRef = { symbolId: other.id, anchor: oa.name };
      if (isAnchorAtCapacity(connections, otherRef, oa.type)) continue;
      for (const da of draggedAnchors) {
        if (!areTypesCompatible(da.anchor.type, oa.type)) continue;
        const draggedRef: AnchorRef = {
          symbolId: draggedSymbol.id,
          anchor: da.anchor.name,
        };
        if (isAnchorAtCapacity(connections, draggedRef, da.anchor.type)) continue;
        const dx = da.world.x - ow.x;
        const dy = da.world.y - ow.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < bestDistSq) {
          bestDistSq = distSq;
          const distance = Math.sqrt(distSq);
          best = {
            dragged: draggedRef,
            target: otherRef,
            draggedAnchor: da.anchor,
            targetAnchor: oa,
            targetWorld: ow,
            distance,
            zone: distance <= SNAP_ZONE ? 'snap' : 'magnetic',
          };
        }
      }
    }
  }
  return best;
}

const TOP_SIDE_TYPES: ReadonlySet<AnchorType> = new Set([
  AnchorType.STITCH_TOP,
  AnchorType.CHAIN_TOP,
  AnchorType.RING_SLOT,
]);

export function isTopSideAnchorType(type: AnchorType): boolean {
  return TOP_SIDE_TYPES.has(type);
}

export interface FanPose {
  x: number;
  y: number;
  rotation: number;
}

/**
 * Compute radial fan positions + rotations for children connected to a single
 * anchor on a parent symbol. 0° points straight up; positive angles fan to the
 * right. Each child is positioned so its connecting anchor lands exactly on the
 * parent anchor's world position after the child is rotated by its fan angle.
 */
export function computeFanLayout(args: {
  anchorSymbol: CanvasSymbol;
  anchorName: string;
  children: { symbolId: string; childAnchorName: string }[];
  symbols: Map<string, CanvasSymbol>;
}): Map<string, FanPose> {
  const { anchorSymbol, anchorName, children, symbols } = args;
  const result = new Map<string, FanPose>();

  const parentAnchor = getSymbolAnchors(anchorSymbol).find(
    (a) => a.name === anchorName,
  );
  if (!parentAnchor) return result;

  const anchorWorld = anchorWorldPos(anchorSymbol, parentAnchor);
  const N = children.length;
  if (N === 0) return result;

  const totalArc = Math.min(30 * (N - 1), 120);
  const startAngle = -totalArc / 2;
  const angleStep = N > 1 ? totalArc / (N - 1) : 0;

  for (let i = 0; i < N; i++) {
    const { symbolId, childAnchorName } = children[i];
    const childSymbol = symbols.get(symbolId);
    if (!childSymbol) continue;
    const childAnchor = getSymbolAnchors(childSymbol).find(
      (a) => a.name === childAnchorName,
    );
    if (!childAnchor) continue;

    const angleDeg = startAngle + i * angleStep;
    const rad = (angleDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // Rotate the child anchor offset (in child-local frame) by angleDeg CW.
    const ax = childAnchor.offsetX;
    const ay = childAnchor.offsetY;
    const rx = ax * cos - ay * sin;
    const ry = ax * sin + ay * cos;

    // Position child center so its rotated anchor lands on the parent anchor.
    result.set(symbolId, {
      x: anchorWorld.x - rx,
      y: anchorWorld.y - ry,
      rotation: angleDeg,
    });
  }

  return result;
}

/**
 * Directional BFS from a parent anchor outward, following only top-side anchor
 * types (STITCH_TOP / CHAIN_TOP / RING_SLOT). Returns the direct children of
 * the root anchor plus all descendants reachable by walking up through their
 * top-side anchors.
 */
export function getDescendantsAbove(
  rootRef: AnchorRef,
  connections: Connection[],
  symbols: Map<string, CanvasSymbol>,
): { childIds: string[]; bfsOrder: string[] } {
  const childIds: string[] = [];
  for (const c of connections) {
    if (
      c.from.symbolId === rootRef.symbolId &&
      c.from.anchor === rootRef.anchor
    ) {
      childIds.push(c.to.symbolId);
    } else if (
      c.to.symbolId === rootRef.symbolId &&
      c.to.anchor === rootRef.anchor
    ) {
      childIds.push(c.from.symbolId);
    }
  }

  const visited = new Set<string>(childIds);
  const queue = [...childIds];
  const bfsOrder: string[] = [...childIds];

  while (queue.length) {
    const id = queue.shift()!;
    const sym = symbols.get(id);
    if (!sym) continue;
    for (const a of getSymbolAnchors(sym)) {
      if (!TOP_SIDE_TYPES.has(a.type)) continue;
      for (const c of connections) {
        let otherId: string | null = null;
        if (c.from.symbolId === id && c.from.anchor === a.name) {
          otherId = c.to.symbolId;
        } else if (c.to.symbolId === id && c.to.anchor === a.name) {
          otherId = c.from.symbolId;
        }
        if (otherId && !visited.has(otherId)) {
          visited.add(otherId);
          queue.push(otherId);
          bfsOrder.push(otherId);
        }
      }
    }
  }

  return { childIds, bfsOrder };
}

export interface RelayoutMove {
  id: string;
  x: number;
  y: number;
  rotation: number;
}

/**
 * BFS from a changed anchor outward, recomputing fan positions for each layer
 * so grandchildren see their parent's new position. Returns the set of symbol
 * pose updates to apply.
 */
export function relayoutFrom(
  changedAnchor: AnchorRef,
  symbols: CanvasSymbol[],
  connections: Connection[],
): RelayoutMove[] {
  const original = new Map(symbols.map((s) => [s.id, s]));
  const updates = new Map<string, RelayoutMove>();

  const effective = (id: string): CanvasSymbol | undefined => {
    const u = updates.get(id);
    const base = original.get(id);
    if (!base) return undefined;
    return u ? { ...base, x: u.x, y: u.y, rotation: u.rotation } : base;
  };

  const queue: AnchorRef[] = [changedAnchor];
  const visited = new Set<string>();

  while (queue.length) {
    const ref = queue.shift()!;
    const key = `${ref.symbolId}:${ref.anchor}`;
    if (visited.has(key)) continue;
    visited.add(key);

    const parentSym = effective(ref.symbolId);
    if (!parentSym) continue;

    const children: { symbolId: string; childAnchorName: string }[] = [];
    for (const c of connections) {
      if (c.from.symbolId === ref.symbolId && c.from.anchor === ref.anchor) {
        children.push({
          symbolId: c.to.symbolId,
          childAnchorName: c.to.anchor,
        });
      } else if (
        c.to.symbolId === ref.symbolId &&
        c.to.anchor === ref.anchor
      ) {
        children.push({
          symbolId: c.from.symbolId,
          childAnchorName: c.from.anchor,
        });
      }
    }
    if (children.length === 0) continue;

    const poses = computeFanLayout({
      anchorSymbol: parentSym,
      anchorName: ref.anchor,
      children,
      symbols: original,
    });

    for (const [childId, pose] of poses) {
      updates.set(childId, { id: childId, ...pose });
      const childSym = original.get(childId);
      if (!childSym) continue;
      for (const a of getSymbolAnchors(childSym)) {
        if (TOP_SIDE_TYPES.has(a.type)) {
          queue.push({ symbolId: childId, anchor: a.name });
        }
      }
    }
  }

  return Array.from(updates.values());
}

/**
 * Run relayoutFrom against multiple anchors in sequence, threading the working
 * symbol state through each call so later relayouts see earlier updates.
 */
export function relayoutFromMany(
  startAnchors: AnchorRef[],
  symbols: CanvasSymbol[],
  connections: Connection[],
): RelayoutMove[] {
  let working = symbols;
  const merged = new Map<string, RelayoutMove>();
  for (const ref of startAnchors) {
    const moves = relayoutFrom(ref, working, connections);
    if (moves.length === 0) continue;
    const moveMap = new Map(moves.map((m) => [m.id, m]));
    working = working.map((s) => {
      const m = moveMap.get(s.id);
      return m ? { ...s, x: m.x, y: m.y, rotation: m.rotation } : s;
    });
    for (const m of moves) merged.set(m.id, m);
  }
  return Array.from(merged.values());
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
