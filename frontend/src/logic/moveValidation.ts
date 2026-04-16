import type { BoardGrid, GamePhase, PieceDefinition, PlayerId } from "./quartoTypes";

export interface ValidationContext {
  phase: GamePhase;
  activePlayer: PlayerId;
  selectedPieceId: string | null;
  board: BoardGrid;
  pieces: PieceDefinition[];
  winner: PlayerId | null;
  draw: boolean;
}

export function canSelectPiece(
  ctx: ValidationContext,
  pieceId: string,
  actingPlayer: PlayerId,
): { ok: true } | { ok: false; reason: "not_your_turn" | "wrong_phase" | "game_over" | "invalid_piece" } {
  if (ctx.winner !== null || ctx.draw) return { ok: false, reason: "game_over" };
  if (ctx.phase !== "select_piece") return { ok: false, reason: "wrong_phase" };
  if (ctx.activePlayer !== actingPlayer) return { ok: false, reason: "not_your_turn" };
  const piece = ctx.pieces.find((p) => p.id === pieceId);
  if (!piece || piece.used) return { ok: false, reason: "invalid_piece" };
  return { ok: true };
}

export function canPlacePiece(
  ctx: ValidationContext,
  row: number,
  col: number,
  actingPlayer: PlayerId,
): { ok: true } | { ok: false; reason: "not_your_turn" | "wrong_phase" | "game_over" | "no_selection" | "occupied" | "out_of_bounds" } {
  if (ctx.winner !== null || ctx.draw) return { ok: false, reason: "game_over" };
  if (ctx.phase !== "place_piece") return { ok: false, reason: "wrong_phase" };
  if (ctx.activePlayer !== actingPlayer) return { ok: false, reason: "not_your_turn" };
  if (!ctx.selectedPieceId) return { ok: false, reason: "no_selection" };
  if (row < 0 || row > 3 || col < 0 || col > 3) return { ok: false, reason: "out_of_bounds" };
  if (ctx.board[row][col] !== null) return { ok: false, reason: "occupied" };
  return { ok: true };
}
