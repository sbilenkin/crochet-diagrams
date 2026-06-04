import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Path, Line, Group, Circle } from 'react-konva';
import type Konva from 'konva';
import { useSymbolEditorStore } from '../../stores/symbolEditorStore';
import { ANCHOR_COLORS } from '../../config/anchorColors';

const CANVAS_PX = 300;
const SCALE = CANVAS_PX / 100; // 3
const ORIGIN = CANVAS_PX / 2;  // 150
const STROKE_W = 2 / SCALE;    // 2px on screen
const ANCHOR_R = 3.5 / SCALE;  // anchor dot radius in symbol space
const SPLINE_DOT_R = 2 / SCALE;
const FINISH_THRESHOLD = 5;
const SNAP_THRESHOLD = 6;

type Point = { x: number; y: number };

function toSymbol(px: number): number {
  return (px - ORIGIN) / SCALE;
}

function r(n: number): string {
  return parseFloat(n.toFixed(3)).toString();
}

function dist(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// Catmull-Rom → SVG cubic bezier. Open variant: duplicates endpoints as phantom boundary nodes.
function pointsToSplinePath(points: Point[]): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M ${r(points[0].x)} ${r(points[0].y)} L ${r(points[1].x)} ${r(points[1].y)}`;
  }
  const p = [points[0], ...points, points[points.length - 1]];
  let d = `M ${r(p[1].x)} ${r(p[1].y)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = p[i], p1 = p[i + 1], p2 = p[i + 2], p3 = p[i + 3];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${r(cp1x)} ${r(cp1y)} ${r(cp2x)} ${r(cp2y)} ${r(p2.x)} ${r(p2.y)}`;
  }
  return d;
}

// Closed variant: wraps around so the curve joins smoothly back to the first point.
function pointsToClosedSplinePath(points: Point[]): string {
  const n = points.length;
  if (n < 2) return '';
  // Extended array wraps: [..., P[n-1], P[0], P[1], ..., P[n-1], P[0], P[1]]
  const p = [points[n - 1], ...points, points[0], points[1]];
  let d = `M ${r(p[1].x)} ${r(p[1].y)}`;
  for (let i = 0; i < n; i++) {
    const p0 = p[i], p1 = p[i + 1], p2 = p[i + 2], p3 = p[i + 3];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${r(cp1x)} ${r(cp1y)} ${r(cp2x)} ${r(cp2y)} ${r(p2.x)} ${r(p2.y)}`;
  }
  return d + ' Z';
}

// Returns the start and end points of a committed path string.
// Closed paths (ending in Z) have only one distinct endpoint.
function extractPathEndpoints(d: string): Point[] {
  const nums = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  if (nums.length < 2) return [];
  const start: Point = { x: nums[0], y: nums[1] };
  if (/[Zz]\s*$/.test(d)) return [start];
  const end: Point = { x: nums[nums.length - 2], y: nums[nums.length - 1] };
  if (start.x === end.x && start.y === end.y) return [start];
  return [start, end];
}

// Returns the nearest snap candidate to `p` within SNAP_THRESHOLD, or null.
function findSnapTarget(p: Point, snapPoints: Point[]): Point | null {
  let best: Point | null = null;
  let bestDist = SNAP_THRESHOLD;
  for (const sp of snapPoints) {
    const d = dist(p, sp);
    if (d < bestDist) { bestDist = d; best = sp; }
  }
  return best;
}

function buildLinePath(sx: number, sy: number, ex: number, ey: number): string {
  return `M ${r(sx)} ${r(sy)} L ${r(ex)} ${r(ey)}`;
}

function Grid() {
  const lines: React.ReactElement[] = [];
  for (let u = -50; u <= 50; u += 10) {
    const p = u * SCALE;
    lines.push(
      <Line key={`h${u}`} points={[-50 * SCALE, p, 50 * SCALE, p]} stroke="#e8e8e8" strokeWidth={1 / SCALE} listening={false} />,
      <Line key={`v${u}`} points={[p, -50 * SCALE, p, 50 * SCALE]} stroke="#e8e8e8" strokeWidth={1 / SCALE} listening={false} />,
    );
  }
  lines.push(
    <Line key="cx" points={[-50 * SCALE, 0, 50 * SCALE, 0]} stroke="#d0d0d0" strokeWidth={1.5 / SCALE} listening={false} />,
    <Line key="cy" points={[0, -50 * SCALE, 0, 50 * SCALE]} stroke="#d0d0d0" strokeWidth={1.5 / SCALE} listening={false} />,
  );
  return <>{lines}</>;
}

export default function DrawingCanvas() {
  const paths = useSymbolEditorStore((s) => s.paths);
  const anchors = useSymbolEditorStore((s) => s.anchors);
  const activeTool = useSymbolEditorStore((s) => s.activeTool);
  const editorMode = useSymbolEditorStore((s) => s.editorMode);
  const commitPath = useSymbolEditorStore((s) => s.commitPath);
  const addAnchor = useSymbolEditorStore((s) => s.addAnchor);
  const removeAnchor = useSymbolEditorStore((s) => s.removeAnchor);

  // Line tool state
  const [lineStart, setLineStart] = useState<Point | null>(null);
  // Shared cursor position (symbol space)
  const [cursor, setCursor] = useState<Point | null>(null);
  // Spline tool: accumulating clicked points
  const [splinePoints, setSplinePoints] = useState<Point[]>([]);

  const stageRef = useRef<Konva.Stage | null>(null);

  // Clear in-progress state when switching tools.
  useEffect(() => {
    setLineStart(null);
    setSplinePoints([]);
  }, [activeTool]);

  // Escape cancels any in-progress drawing.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setLineStart(null);
        setSplinePoints([]);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Endpoints of all committed paths — candidates for snapping.
  const snapPoints = paths.flatMap(extractPathEndpoints);

  function getPointer(): Point | null {
    const pos = stageRef.current?.getPointerPosition();
    if (!pos) return null;
    return { x: toSymbol(pos.x), y: toSymbol(pos.y) };
  }

  // Raw pointer snapped to the nearest existing endpoint, if within threshold.
  function getSnappedPoint(): Point | null {
    const p = getPointer();
    if (!p) return null;
    return findSnapTarget(p, snapPoints) ?? p;
  }

  function handleMouseMove() {
    const p = getPointer();
    if (!p) return;
    setCursor(p);
  }

  function handleStageClick() {
    const p = getSnappedPoint();
    if (!p) return;

    if (editorMode === 'connections') {
      addAnchor(p.x, p.y);
      return;
    }

    if (activeTool === 'line') {
      if (!lineStart) {
        setLineStart(p);
      } else {
        if (lineStart.x !== p.x || lineStart.y !== p.y) {
          commitPath(buildLinePath(lineStart.x, lineStart.y, p.x, p.y));
        }
        setLineStart(null);
      }
      return;
    }

    if (activeTool !== 'curve') return;

    if (splinePoints.length === 0) {
      setSplinePoints([p]);
      return;
    }

    const last = splinePoints[splinePoints.length - 1];
    const first = splinePoints[0];
    if (splinePoints.length >= 3 && dist(p, first) < FINISH_THRESHOLD) {
      // Near the first point — close the spline.
      commitPath(pointsToClosedSplinePath(splinePoints));
      setSplinePoints([]);
    } else if (dist(p, last) < FINISH_THRESHOLD) {
      // Near the last point — finish open.
      if (splinePoints.length >= 2) {
        commitPath(pointsToSplinePath(splinePoints));
      }
      setSplinePoints([]);
    } else {
      setSplinePoints((pts) => [...pts, p]);
    }
  }

  // Snap target for the current cursor position (for ghost + visual indicator).
  const snapTarget = cursor ? findSnapTarget(cursor, snapPoints) : null;
  const effectiveCursor = snapTarget ?? cursor;

  // Ghost path: committed points + effective cursor, shown while drawing.
  const ghostPath: string | null = (() => {
    if (editorMode !== 'draw' || !effectiveCursor) return null;
    if (activeTool === 'line' && lineStart) {
      return buildLinePath(lineStart.x, lineStart.y, effectiveCursor.x, effectiveCursor.y);
    }
    if (activeTool === 'curve' && splinePoints.length > 0) {
      return pointsToSplinePath([...splinePoints, effectiveCursor]);
    }
    return null;
  })();

  function handleMouseLeave() {
    setCursor(null);
  }

  return (
    <div style={{ border: '1px solid #dee2e6', display: 'inline-block', cursor: 'crosshair' }}>
      <Stage
        ref={stageRef}
        width={CANVAS_PX}
        height={CANVAS_PX}
        onMouseMove={handleMouseMove}
        onClick={handleStageClick}
        onMouseLeave={handleMouseLeave}
      >
        <Layer>
          <Group x={ORIGIN} y={ORIGIN} scaleX={SCALE} scaleY={SCALE}>
            <Grid />
            {paths.map((d, i) => (
              <Path key={i} data={d} stroke="black" strokeWidth={STROKE_W} fillEnabled={false} listening={false} />
            ))}
            {ghostPath && (
              <Path data={ghostPath} stroke="#666" strokeWidth={STROKE_W} dash={[3 / SCALE, 3 / SCALE]} fillEnabled={false} listening={false} />
            )}
            {/* Snap indicator: ring around the nearest snappable endpoint */}
            {editorMode === 'draw' && snapTarget && (
              <Circle
                x={snapTarget.x} y={snapTarget.y}
                radius={ANCHOR_R + 1 / SCALE}
                stroke="#0d6efd" strokeWidth={1 / SCALE}
                fillEnabled={false} listening={false}
              />
            )}
            {/* Dot at line first point while waiting for second click */}
            {editorMode === 'draw' && activeTool === 'line' && lineStart && (
              <Circle x={lineStart.x} y={lineStart.y} radius={SPLINE_DOT_R} fill="#0d6efd" listening={false} />
            )}
            {/* Dots at committed spline points while a spline is in progress */}
            {editorMode === 'draw' && activeTool === 'curve' && splinePoints.map((pt, i) => {
              const isFirst = i === 0;
              const closable = isFirst && splinePoints.length >= 3;
              return (
                <Circle
                  key={i}
                  x={pt.x} y={pt.y}
                  radius={closable ? ANCHOR_R : SPLINE_DOT_R}
                  fill={closable ? '#198754' : isFirst ? '#0d6efd' : '#6c757d'}
                  listening={false}
                />
              );
            })}
            {/* Anchor dots — visible in both modes */}
            {anchors.map((a, i) => (
              <Circle
                key={i}
                x={a.offsetX} y={a.offsetY}
                radius={ANCHOR_R}
                fill={ANCHOR_COLORS[a.type]}
                stroke="white" strokeWidth={0.5 / SCALE}
                onClick={(e) => {
                  if (editorMode === 'connections') {
                    e.cancelBubble = true;
                    removeAnchor(i);
                  }
                }}
              />
            ))}
          </Group>
        </Layer>
      </Stage>
    </div>
  );
}
