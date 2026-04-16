const SPACING = 1.05;

export function cellToWorld(row: number, col: number): [number, number, number] {
  const x = (col - 1.5) * SPACING;
  const z = (row - 1.5) * SPACING;
  return [x, 0, z];
}

export function traySlotWorld(index: number): [number, number, number] {
  const col = index % 4;
  const row = Math.floor(index / 4);
  const x = 3.2 + col * 0.78;
  const z = -1.2 + row * 0.78;
  return [x, 0.1, z];
}
