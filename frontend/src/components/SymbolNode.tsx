import { memo, useEffect, useState } from 'react';
import { Group, Image as KonvaImage, Rect } from 'react-konva';
import type Konva from 'konva';
import { CROCHET_SYMBOLS } from '../config/crochetSymbols';
import { useCanvasStore } from '../stores/canvasStore';
import type { CanvasSymbol } from '../types/canvas';

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

function SymbolNode({ symbol, selected }: Props) {
  const def = CROCHET_SYMBOLS[symbol.type];
  const image = useHtmlImage(def?.svgPath ?? '');
  const moveSymbol = useCanvasStore((s) => s.moveSymbol);
  const selectSymbol = useCanvasStore((s) => s.selectSymbol);

  if (!def) return null;

  const { width, height } = def;

  return (
    <Group
      x={symbol.x}
      y={symbol.y}
      rotation={symbol.rotation}
      draggable
      onClick={(e) => {
        e.cancelBubble = true;
        selectSymbol(symbol.id);
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        selectSymbol(symbol.id);
      }}
      onDragStart={(e) => {
        e.cancelBubble = true;
        selectSymbol(symbol.id);
      }}
      onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
        moveSymbol(symbol.id, e.target.x(), e.target.y());
      }}
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
