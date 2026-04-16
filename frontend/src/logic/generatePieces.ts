import type { PieceDefinition } from "./quartoTypes";

const colors = ["light", "dark"] as const;
const heights = ["short", "tall"] as const;
const shapes = ["round", "square"] as const;
const tops = ["solid", "hollow"] as const;

export function generatePieces(): PieceDefinition[] {
  const pieces: PieceDefinition[] = [];
  let idx = 0;
  for (const color of colors) {
    for (const height of heights) {
      for (const shape of shapes) {
        for (const top of tops) {
          pieces.push({
            id: String(idx),
            color,
            height,
            shape,
            top,
            used: false,
          });
          idx += 1;
        }
      }
    }
  }
  return pieces;
}

export function emptyBoard(): import("./quartoTypes").BoardGrid {
  return [
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
  ];
}
