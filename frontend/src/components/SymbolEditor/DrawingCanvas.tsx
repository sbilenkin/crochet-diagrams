import { useRef, useState } from 'react';
import { Stage, Layer, Path, Line, Group } from 'react-konva';
import type Konva from 'konva';
import { useSymbolEditorStore } from '../../stores/symbolEditorStore';

// Editor canvas is 300×300 px. Symbol space is −50..+50 on both axes.
const CANVAS_PX = 300;
const SCALE = CANVAS_PX / 100; // 3
const ORIGIN = CANVAS_PX / 2;  // 150
const STROKE_W = 2 / SCALE;    // 2px on screen

function toSymbol(px: number): number {
  return (px - ORIGIN) / SCALE;
}

type CurveState =
  | { phase: 'idle' }
  | { phase: 'hasStart'; sx: number; sy: number }
  | { phase: 'hasControl'; sx: number; sy: number; cx: number; cy: number };

function buildLinePath(sx: number, sy: number, ex: number, ey: number): string {
  return `M ${sx} ${sy} L ${ex} ${ey}`;
}

function buildCurvePath(sx: number, sy: number, cx: number, cy: number, ex: number, ey: number): string {
  return `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`;
}

// Vertical and horizontal grid at every 10 units in symbol space.
function Grid() {
  const lines: React.ReactElement[] = [];
  for (let u = -50; u <= 50; u += 10) {
    const p = u * SCALE; // pixel offset from group origin (0,0 = symbol center)
    // horizontal line at y = u
    lines.push(
      <Line key={`h${u}`} points={[-50 * SCALE, p, 50 * SCALE, p]} stroke="#e8e8e8" strokeWidth={1 / SCALE} listening={false} />,
    );
    // vertical line at x = u
    lines.push(
      <Line key={`v${u}`} points={[p, -50 * SCALE, p, 50 * SCALE]} stroke="#e8e8e8" strokeWidth={1 / SCALE} listening={false} />,
    );
  }
  // Center cross
  lines.push(
    <Line key="cx" points={[-50 * SCALE, 0, 50 * SCALE, 0]} stroke="#d0d0d0" strokeWidth={1.5 / SCALE} listening={false} />,
    <Line key="cy" points={[0, -50 * SCALE, 0, 50 * SCALE]} stroke="#d0d0d0" strokeWidth={1.5 / SCALE} listening={false} />,
  );
  return <>{lines}</>;
}

export default function DrawingCanvas() {
  const paths = useSymbolEditorStore((s) => s.paths);
  const activeTool = useSymbolEditorStore((s) => s.activeTool);
  const commitPath = useSymbolEditorStore((s) => s.commitPath);

  // In-progress state for line tool
  const [lineStart, setLineStart] = useState<{ x: number; y: number } | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  // In-progress state for curve tool
  const [curveState, setCurveState] = useState<CurveState>({ phase: 'idle' });

  const stageRef = useRef<Konva.Stage | null>(null);

  function getPointer(): { x: number; y: number } | null {
    const pos = stageRef.current?.getPointerPosition();
    if (!pos) return null;
    return { x: toSymbol(pos.x), y: toSymbol(pos.y) };
  }

  function handleMouseDown() {
    if (activeTool !== 'line') return;
    const p = getPointer();
    if (!p) return;
    setLineStart(p);
    setCursor(p);
  }

  function handleMouseMove() {
    const p = getPointer();
    if (!p) return;
    setCursor(p);
  }

  function handleMouseUp() {
    if (activeTool !== 'line' || !lineStart || !cursor) return;
    // Ignore zero-length lines
    if (lineStart.x !== cursor.x || lineStart.y !== cursor.y) {
      commitPath(buildLinePath(lineStart.x, lineStart.y, cursor.x, cursor.y));
    }
    setLineStart(null);
    setCursor(null);
  }

  function handleClick() {
    if (activeTool !== 'curve') return;
    const p = getPointer();
    if (!p) return;

    if (curveState.phase === 'idle') {
      setCurveState({ phase: 'hasStart', sx: p.x, sy: p.y });
    } else if (curveState.phase === 'hasStart') {
      setCurveState({ phase: 'hasControl', sx: curveState.sx, sy: curveState.sy, cx: p.x, cy: p.y });
    } else if (curveState.phase === 'hasControl') {
      commitPath(buildCurvePath(curveState.sx, curveState.sy, curveState.cx, curveState.cy, p.x, p.y));
      setCurveState({ phase: 'idle' });
    }
  }

  // Ghost path shown while drawing
  function ghostPathData(): string | null {
    if (!cursor) return null;
    if (activeTool === 'line' && lineStart) {
      return buildLinePath(lineStart.x, lineStart.y, cursor.x, cursor.y);
    }
    if (activeTool === 'curve') {
      if (curveState.phase === 'hasStart') {
        return buildLinePath(curveState.sx, curveState.sy, cursor.x, cursor.y);
      }
      if (curveState.phase === 'hasControl') {
        return buildCurvePath(curveState.sx, curveState.sy, curveState.cx, curveState.cy, cursor.x, cursor.y);
      }
    }
    return null;
  }

  const ghost = ghostPathData();

  // Reset in-progress state when tool changes
  function handleMouseLeave() {
    setCursor(null);
    if (activeTool === 'line') setLineStart(null);
  }

  return (
    <div style={{ border: '1px solid #dee2e6', display: 'inline-block', cursor: 'crosshair' }}>
      <Stage
        ref={stageRef}
        width={CANVAS_PX}
        height={CANVAS_PX}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        onMouseLeave={handleMouseLeave}
      >
        <Layer>
          {/* All drawing is done in symbol-space coordinates via this group */}
          <Group x={ORIGIN} y={ORIGIN} scaleX={SCALE} scaleY={SCALE}>
            <Grid />
            {paths.map((d, i) => (
              <Path key={i} data={d} stroke="black" strokeWidth={STROKE_W} fillEnabled={false} listening={false} />
            ))}
            {ghost && (
              <Path data={ghost} stroke="#666" strokeWidth={STROKE_W} dash={[3 / SCALE, 3 / SCALE]} fillEnabled={false} listening={false} />
            )}
            {/* Dot at curve start/control point */}
            {activeTool === 'curve' && curveState.phase !== 'idle' && (
              <Path
                data={`M ${curveState.sx - 1.5 / SCALE} ${curveState.sy} a ${1.5 / SCALE} ${1.5 / SCALE} 0 1 0 ${3 / SCALE} 0 a ${1.5 / SCALE} ${1.5 / SCALE} 0 1 0 ${-3 / SCALE} 0`}
                fill="#0d6efd"
                listening={false}
              />
            )}
            {activeTool === 'curve' && curveState.phase === 'hasControl' && cursor && (
              <Path
                data={`M ${curveState.cx - 1.5 / SCALE} ${curveState.cy} a ${1.5 / SCALE} ${1.5 / SCALE} 0 1 0 ${3 / SCALE} 0 a ${1.5 / SCALE} ${1.5 / SCALE} 0 1 0 ${-3 / SCALE} 0`}
                fill="#6c757d"
                listening={false}
              />
            )}
          </Group>
        </Layer>
      </Stage>
    </div>
  );
}
