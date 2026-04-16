import type { BoardGrid, PieceDefinition, WinResult } from "./quartoTypes";

const LINES: { row: number; col: number }[][] = [];

for (let r = 0; r < 4; r += 1) {
  LINES.push(
    [0, 1, 2, 3].map((c) => ({ row: r, col: c })),
  );
}
for (let c = 0; c < 4; c += 1) {
  LINES.push(
    [0, 1, 2, 3].map((r) => ({ row: r, col: c })),
  );
}
LINES.push(
  [0, 1, 2, 3].map((i) => ({ row: i, col: i })),
);
LINES.push(
  [0, 1, 2, 3].map((i) => ({ row: i, col: 3 - i })),
);

function pieceById(pieces: PieceDefinition[], id: string): PieceDefinition | undefined {
  return pieces.find((p) => p.id === id);
}

export function evaluateWin(board: BoardGrid, pieces: PieceDefinition[]): WinResult {
  for (const line of LINES) {
    const ids = line.map(({ row, col }) => board[row][col]);
    if (ids.some((id) => id === null)) continue;
    const linePieces = ids.map((id) => pieceById(pieces, id!)) as PieceDefinition[];
    const attrs = ["color", "height", "shape", "top"] as const;
    const matching: ("color" | "height" | "shape" | "top")[] = [];
    for (const attr of attrs) {
      const first = linePieces[0][attr];
      if (linePieces.every((p) => p[attr] === first)) {
        matching.push(attr);
      }
    }
    if (matching.length > 0) {
      return { win: true, winningCells: line, matchingAttributes: matching };
    }
  }
  return { win: false, winningCells: [], matchingAttributes: [] };
}
