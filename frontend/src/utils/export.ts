import type Konva from 'konva';
import { jsPDF } from 'jspdf';

const PADDING = 40;
const THUMBNAIL_MAX = 320;
const EXPORT_PIXEL_RATIO = 2;

type Bounds = { x: number; y: number; width: number; height: number };

function getContentBounds(stage: Konva.Stage): Bounds | null {
  const layer = stage.getLayers()[0];
  if (!layer) return null;
  const rect = layer.getClientRect({ relativeTo: stage });
  if (rect.width === 0 || rect.height === 0) return null;
  return {
    x: rect.x - PADDING,
    y: rect.y - PADDING,
    width: rect.width + PADDING * 2,
    height: rect.height + PADDING * 2,
  };
}

function captureDataURL(
  stage: Konva.Stage,
  pixelRatio: number,
  mimeType: 'image/png' | 'image/jpeg' = 'image/png',
): { url: string; bounds: Bounds } | null {
  const prevX = stage.x();
  const prevY = stage.y();
  const prevSx = stage.scaleX();
  const prevSy = stage.scaleY();
  stage.position({ x: 0, y: 0 });
  stage.scale({ x: 1, y: 1 });
  try {
    const bounds = getContentBounds(stage);
    if (!bounds) return null;
    const url = stage.toDataURL({ ...bounds, pixelRatio, mimeType });
    return { url, bounds };
  } finally {
    stage.position({ x: prevX, y: prevY });
    stage.scale({ x: prevSx, y: prevSy });
  }
}

function triggerDownload(dataUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

function safeFilename(name: string): string {
  const trimmed = name.trim().replace(/[^a-z0-9._-]+/gi, '_');
  return trimmed || 'diagram';
}

export function exportPNG(stage: Konva.Stage, name: string): boolean {
  const result = captureDataURL(stage, EXPORT_PIXEL_RATIO, 'image/png');
  if (!result) return false;
  triggerDownload(result.url, `${safeFilename(name)}.png`);
  return true;
}

export function exportPDF(stage: Konva.Stage, name: string): boolean {
  const result = captureDataURL(stage, EXPORT_PIXEL_RATIO, 'image/png');
  if (!result) return false;
  const { url, bounds } = result;
  const orientation = bounds.width >= bounds.height ? 'landscape' : 'portrait';
  const pdf = new jsPDF({
    orientation,
    unit: 'pt',
    format: [bounds.width, bounds.height],
  });
  pdf.addImage(url, 'PNG', 0, 0, bounds.width, bounds.height);
  pdf.save(`${safeFilename(name)}.pdf`);
  return true;
}

export function generateThumbnail(stage: Konva.Stage): string | null {
  const layer = stage.getLayers()[0];
  if (!layer) return null;
  const rect = layer.getClientRect({ relativeTo: stage });
  if (rect.width === 0 || rect.height === 0) return null;
  const longer = Math.max(rect.width + PADDING * 2, rect.height + PADDING * 2);
  const pixelRatio = THUMBNAIL_MAX / longer;
  const result = captureDataURL(stage, pixelRatio, 'image/png');
  return result?.url ?? null;
}
