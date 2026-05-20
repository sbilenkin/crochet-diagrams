import { Arrow } from 'react-konva';
import { useCanvasStore } from '../stores/canvasStore';
import { CROCHET_SYMBOLS } from '../config/crochetSymbols';

const ARROW_COLOR = '#dc2626';

// Always-visible, non-interactive arrow pointing at the diagram's starting stitch.
function StartIndicatorOverlay() {
  const symbols = useCanvasStore((s) => s.symbols);
  const start = symbols.find((s) => s.isStart);
  const def = start ? CROCHET_SYMBOLS[start.type] : undefined;
  if (!start || !def) return null;

  // Tip sits just off the stitch's top-left corner; tail trails up-and-left.
  const tipX = start.x - def.width / 2 - 1;
  const tipY = start.y - def.height / 2 - 1;
  return (
    <Arrow
      points={[tipX - 16, tipY - 16, tipX, tipY]}
      pointerLength={8}
      pointerWidth={8}
      stroke={ARROW_COLOR}
      strokeWidth={2.5}
      fill={ARROW_COLOR}
      listening={false}
    />
  );
}

export default StartIndicatorOverlay;
