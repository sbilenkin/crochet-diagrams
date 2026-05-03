import type Konva from 'konva';

const nodes = new Map<string, Konva.Node>();

export const konvaRegistry = {
  set(id: string, node: Konva.Node | null): void {
    if (node) nodes.set(id, node);
    else nodes.delete(id);
  },
  get(id: string): Konva.Node | undefined {
    return nodes.get(id);
  },
};
