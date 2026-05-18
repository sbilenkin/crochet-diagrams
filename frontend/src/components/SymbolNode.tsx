import { memo, useEffect, useRef, useState } from 'react';
import { Group, Image as KonvaImage, Rect } from 'react-konva';
import Konva from 'konva';
import { CROCHET_SYMBOLS } from '../config/crochetSymbols';
import { useCanvasStore } from '../stores/canvasStore';
import type { AnchorRef, CanvasSymbol, Connection } from '../types/canvas';
import {
  DETACH_THRESHOLD,
  MAGNETIC_BIAS,
  SNAP_ANIM_MS,
  anchorWorldPos,
  findSnapMatch,
  getConnectedComponent,
  getSymbolAnchors,
  type SnapMatch,
} from '../utils/anchors';
import { konvaRegistry } from '../utils/konvaRegistry';
import type { TentativeDetach } from '../stores/canvasStore';

// Tracks the last pose each Konva node was *visually* settled at — updated by
// both the drag-end tween and the prop-watching useEffect. Lets the effect tell
// "react-konva applied a pose I haven't shown the user yet" (needs tween) from
// "react-konva applied a pose I already tweened to" (no-op).
interface Pose {
  x: number;
  y: number;
  rotation: number;
}
const lastSettledPoseRegistry = new Map<string, Pose>();

function poseEqual(a: Pose, b: Pose): boolean {
  return a.x === b.x && a.y === b.y && a.rotation === b.rotation;
}

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
  // Elastic detach (shift+drag): connections kept tentatively until pulled past DETACH_THRESHOLD.
  tentativeDetaches: TentativeDetach[];
  isShiftDrag: boolean;
}

function buildTentativeDetaches(
  symbol: CanvasSymbol,
  connections: Connection[],
  allSymbols: CanvasSymbol[],
): TentativeDetach[] {
  const result: TentativeDetach[] = [];
  for (const c of connections) {
    let symbolSide: { symbolId: string; anchor: string } | null = null;
    let otherSide: { symbolId: string; anchor: string } | null = null;
    if (c.from.symbolId === symbol.id) {
      symbolSide = c.from;
      otherSide = c.to;
    } else if (c.to.symbolId === symbol.id) {
      symbolSide = c.to;
      otherSide = c.from;
    }
    if (!symbolSide || !otherSide) continue;
    const otherSym = allSymbols.find((s) => s.id === otherSide!.symbolId);
    if (!otherSym) continue;
    const otherAnchor = getSymbolAnchors(otherSym).find(
      (a) => a.name === otherSide!.anchor,
    );
    if (!otherAnchor) continue;
    result.push({
      symbolAnchor: symbolSide,
      formerTarget: otherSide,
      targetWorld: anchorWorldPos(otherSym, otherAnchor),
    });
  }
  return result;
}

function SymbolNode({ symbol, selected }: Props) {
  const def = CROCHET_SYMBOLS[symbol.type];
  const image = useHtmlImage(def?.svgPath ?? '');
  const sessionRef = useRef<DragSession | null>(null);
  const lastMatchRef = useRef<SnapMatch | null>(null);
  const groupRef = useRef<Konva.Group | null>(null);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    return () => {
      konvaRegistry.set(symbol.id, null);
      lastSettledPoseRegistry.delete(symbol.id);
    };
  }, [symbol.id]);

  // Animate prop-driven pose changes (e.g., fan-out re-layout after a connect).
  // Skips the drag path (instant follow for siblings, drag-end has its own tween).
  useEffect(() => {
    const node = groupRef.current;
    if (!node) return;
    const target: Pose = {
      x: symbol.x,
      y: symbol.y,
      rotation: symbol.rotation,
    };
    const settled = lastSettledPoseRegistry.get(symbol.id);

    // First time we see this symbol — establish the baseline, no animation.
    if (!settled) {
      lastSettledPoseRegistry.set(symbol.id, target);
      return;
    }
    if (poseEqual(settled, target)) return;

    // During an active drag, react-konva's declarative update already moved
    // the node; let it follow instantly rather than starting a tween.
    const dragActive =
      useCanvasStore.getState().dragState !== null ||
      sessionRef.current !== null;
    if (dragActive) {
      lastSettledPoseRegistry.set(symbol.id, target);
      return;
    }

    // react-konva has already set the node to `target`. Snap back to the
    // last-settled pose so Konva.to() animates the full distance.
    node.x(settled.x);
    node.y(settled.y);
    node.rotation(settled.rotation);

    setAnimating(true);
    node.to({
      x: target.x,
      y: target.y,
      rotation: target.rotation,
      duration: SNAP_ANIM_MS / 1000,
      easing: Konva.Easings.EaseOut,
      onFinish: () => {
        lastSettledPoseRegistry.set(symbol.id, target);
        setAnimating(false);
      },
    });
  }, [symbol.id, symbol.x, symbol.y, symbol.rotation]);

  if (!def) return null;
  const { width, height } = def;

  const handleDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    const store = useCanvasStore.getState();
    store.beginHistoryBatch();
    store.selectSymbol(symbol.id);

    const shift = (e.evt as DragEvent & { shiftKey?: boolean }).shiftKey ?? false;
    const conns = store.connections;
    const allSymbols = store.symbols;

    let componentIds: Set<string>;
    let tentativeDetaches: TentativeDetach[] = [];
    if (shift) {
      // Elastic detach: do NOT disconnect yet. Capture connections + their target world
      // positions; they'll commit as broken once pulled past DETACH_THRESHOLD.
      tentativeDetaches = buildTentativeDetaches(symbol, conns, allSymbols);
      componentIds = new Set([symbol.id]);
    } else {
      componentIds = getConnectedComponent(symbol.id, conns);
    }

    const initialPositions = new Map<string, { x: number; y: number }>();
    for (const s of allSymbols) {
      if (componentIds.has(s.id)) {
        initialPositions.set(s.id, { x: s.x, y: s.y });
      }
    }
    sessionRef.current = {
      rootStart: { x: e.target.x(), y: e.target.y() },
      initialPositions,
      componentIds,
      tentativeDetaches,
      isShiftDrag: shift,
    };
    lastMatchRef.current = null;
    store.setDragState({
      activeId: symbol.id,
      rootX: e.target.x(),
      rootY: e.target.y(),
      magneticTarget: null,
      snapTarget: null,
      tentativeDetaches,
    });
  };

  // dragBoundFunc runs BEFORE Konva commits each drag position. By returning
  // the biased position here, Konva uses the same value for both the rendered
  // position AND its internal cursor-tracking baseline — no jitter.
  const handleDragBound = (pos: { x: number; y: number }) => {
    const session = sessionRef.current;
    if (!session) return pos;
    const store = useCanvasStore.getState();
    const match = findSnapMatch(
      symbol,
      pos.x,
      pos.y,
      store.symbols,
      store.connections,
      session.componentIds,
    );
    lastMatchRef.current = match;
    if (!match) return pos;
    const targetRootX = match.targetWorld.x - match.draggedAnchor.offsetX;
    const targetRootY = match.targetWorld.y - match.draggedAnchor.offsetY;
    const t = match.zone === 'snap' ? 1 : MAGNETIC_BIAS;
    return {
      x: pos.x + (targetRootX - pos.x) * t,
      y: pos.y + (targetRootY - pos.y) * t,
    };
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const session = sessionRef.current;
    if (!session) return;

    const store = useCanvasStore.getState();
    const draggedX = e.target.x();
    const draggedY = e.target.y();

    // Step 1: process elastic detaches — break any whose pull exceeded DETACH_THRESHOLD.
    if (session.tentativeDetaches.length > 0) {
      const remaining: TentativeDetach[] = [];
      for (const td of session.tentativeDetaches) {
        const draggedAnchor = getSymbolAnchors(symbol).find(
          (a) => a.name === td.symbolAnchor.anchor,
        );
        if (!draggedAnchor) continue;
        const ax = draggedX + draggedAnchor.offsetX;
        const ay = draggedY + draggedAnchor.offsetY;
        const dx = ax - td.targetWorld.x;
        const dy = ay - td.targetWorld.y;
        if (dx * dx + dy * dy > DETACH_THRESHOLD * DETACH_THRESHOLD) {
          store.disconnectAtAnchor(td.symbolAnchor);
        } else {
          remaining.push(td);
        }
      }
      session.tentativeDetaches = remaining;
    }

    // Step 2: move sibling members of the connected component to follow the dragged root.
    const dx = draggedX - session.rootStart.x;
    const dy = draggedY - session.rootStart.y;
    const updates: Array<{ id: string; x: number; y: number }> = [];
    session.initialPositions.forEach((pos, id) => {
      if (id === symbol.id) return;
      updates.push({ id, x: pos.x + dx, y: pos.y + dy });
    });
    if (updates.length) store.moveSymbols(updates);

    // Step 3: publish drag state (using the match dragBoundFunc just computed).
    const match = lastMatchRef.current;
    store.setDragState({
      activeId: symbol.id,
      rootX: draggedX,
      rootY: draggedY,
      magneticTarget: match
        ? { dragged: match.dragged, target: match.target }
        : null,
      snapTarget:
        match && match.zone === 'snap'
          ? { dragged: match.dragged, target: match.target }
          : null,
      tentativeDetaches: session.tentativeDetaches,
    });
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const session = sessionRef.current;
    sessionRef.current = null;
    lastMatchRef.current = null;
    const store = useCanvasStore.getState();

    let finalRootX = e.target.x();
    let finalRootY = e.target.y();
    let snapMatch: ReturnType<typeof findSnapMatch> = null;
    let snapBackToOrigin = false;

    if (session?.isShiftDrag && session.tentativeDetaches.length > 0) {
      // User let go while still tethered → snap back to original position, keep connections.
      finalRootX = session.rootStart.x;
      finalRootY = session.rootStart.y;
      snapBackToOrigin = true;
    } else {
      const others = store.symbols;
      const excludeIds = session?.componentIds ?? new Set([symbol.id]);
      snapMatch = findSnapMatch(
        symbol,
        finalRootX,
        finalRootY,
        others,
        store.connections,
        excludeIds,
      );
      if (snapMatch && snapMatch.zone === 'snap') {
        finalRootX = snapMatch.targetWorld.x - snapMatch.draggedAnchor.offsetX;
        finalRootY = snapMatch.targetWorld.y - snapMatch.draggedAnchor.offsetY;
      } else {
        snapMatch = null;
      }
    }

    const shouldAnimate = snapMatch !== null || snapBackToOrigin;

    // Compute the per-symbol final positions.
    const finalPositions = new Map<string, { x: number; y: number }>();
    if (session) {
      const dx = finalRootX - session.rootStart.x;
      const dy = finalRootY - session.rootStart.y;
      session.initialPositions.forEach((pos, id) => {
        finalPositions.set(id, { x: pos.x + dx, y: pos.y + dy });
      });
    } else {
      finalPositions.set(symbol.id, { x: finalRootX, y: finalRootY });
    }

    const commit = () => {
      const updates = Array.from(finalPositions, ([id, pos]) => ({
        id,
        x: pos.x,
        y: pos.y,
      }));
      store.moveSymbols(updates);
      // Keep Konva node in sync with committed position.
      e.target.position({ x: finalRootX, y: finalRootY });
      if (snapMatch) {
        store.connectSymbols(snapMatch.dragged, snapMatch.target);
      }
      store.setDragState(null);
      store.commitHistoryBatch();
      setAnimating(false);
    };

    if (shouldAnimate) {
      setAnimating(true);
      const dur = SNAP_ANIM_MS / 1000;
      const easing = Konva.Easings.EaseOut;
      let pending = 0;
      const onEach = () => {
        pending -= 1;
        if (pending === 0) commit();
      };
      finalPositions.forEach((pos, id) => {
        const node = id === symbol.id ? e.target : konvaRegistry.get(id);
        if (!node) return;
        pending += 1;
        node.to({
          x: pos.x,
          y: pos.y,
          duration: dur,
          easing,
          onFinish: () => {
            // Record the visually-settled pose so the prop-watching effect
            // doesn't redundantly re-animate when commit() updates the store.
            lastSettledPoseRegistry.set(id, {
              x: pos.x,
              y: pos.y,
              rotation: node.rotation(),
            });
            onEach();
          },
        });
      });
      if (pending === 0) commit();
    } else {
      commit();
    }
  };

  const handleRegisterRef = (node: Konva.Group | null) => {
    groupRef.current = node;
    konvaRegistry.set(symbol.id, node);
  };

  return (
    <Group
      ref={handleRegisterRef}
      x={symbol.x}
      y={symbol.y}
      rotation={symbol.rotation}
      draggable={!animating}
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
      dragBoundFunc={handleDragBound}
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
