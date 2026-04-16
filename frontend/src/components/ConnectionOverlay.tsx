import { useMemo } from 'react';
import { Group, Line } from 'react-konva';
import { useCanvasStore } from '../stores/canvasStore';
import { CROCHET_SYMBOLS } from '../config/crochetSymbols';
import type { CanvasSymbol } from '../types/canvas';

function anchorPos(symbol: CanvasSymbol, anchorName: string) {
  const def = CROCHET_SYMBOLS[symbol.type];
  const a = def?.anchors.find((x) => x.name === anchorName);
  if (!a) return null;
  return { x: symbol.x + a.offsetX, y: symbol.y + a.offsetY };
}

function ConnectionOverlay() {
  const symbols = useCanvasStore((s) => s.symbols);
  const connections = useCanvasStore((s) => s.connections);

  const symbolMap = useMemo(() => {
    const m = new Map<string, CanvasSymbol>();
    for (const s of symbols) m.set(s.id, s);
    return m;
  }, [symbols]);

  return (
    <Group listening={false}>
      {connections.map((c, i) => {
        const fromSym = symbolMap.get(c.from.symbolId);
        const toSym = symbolMap.get(c.to.symbolId);
        if (!fromSym || !toSym) return null;
        const a = anchorPos(fromSym, c.from.anchor);
        const b = anchorPos(toSym, c.to.anchor);
        if (!a || !b) return null;
        return (
          <Line
            key={i}
            points={[a.x, a.y, b.x, b.y]}
            stroke="#0d6efd"
            strokeWidth={1}
            opacity={0.4}
            dash={[3, 3]}
          />
        );
      })}
    </Group>
  );
}

export default ConnectionOverlay;
