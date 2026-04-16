import { emptyBoard, generatePieces } from "./generatePieces";
import type {
  BoardGrid,
  GamePhase,
  GameSnapshot,
  MoveHistoryEntry,
  PieceDefinition,
  PlayerId,
} from "./quartoTypes";

export type { GameSnapshot } from "./quartoTypes";
import { evaluateWin } from "./winCheck";

let historySeq = 0;

function uid(): string {
  historySeq += 1;
  return `${Date.now()}-${historySeq}`;
}

function clonePieces(pieces: PieceDefinition[]): PieceDefinition[] {
  return pieces.map((p) => ({ ...p }));
}

function cloneBoard(board: BoardGrid): BoardGrid {
  return board.map((row) => [...row]) as BoardGrid;
}

export function createInitialSnapshot(overrides: Partial<GameSnapshot> = {}): GameSnapshot {
  const pieces = generatePieces();
  return {
    mode: "menu",
    currentPhase: "select_piece",
    activePlayer: 1,
    selectedPieceId: null,
    board: emptyBoard(),
    pieces,
    winner: null,
    draw: false,
    winningCells: [],
    matchingAttributes: [],
    moveHistory: [],
    roomId: null,
    connectionStatus: "idle",
    lastErrorKey: null,
    botThinking: false,
    humanPlayer: 1,
    myPlayer: null,
    opponentOnline: true,
    rematchPendingFrom: null,
    awaitingOpponent: false,
    ...overrides,
  };
}

export function snapshotForNewGame(base: GameSnapshot): GameSnapshot {
  return {
    ...base,
    currentPhase: "select_piece",
    activePlayer: 1,
    selectedPieceId: null,
    board: emptyBoard(),
    pieces: generatePieces(),
    winner: null,
    draw: false,
    winningCells: [],
    matchingAttributes: [],
    moveHistory: [],
    lastErrorKey: null,
    botThinking: false,
    rematchPendingFrom: null,
    awaitingOpponent: false,
  };
}

function appendHistory(
  history: MoveHistoryEntry[],
  entry: Omit<MoveHistoryEntry, "id" | "timestamp">,
): MoveHistoryEntry[] {
  const full: MoveHistoryEntry = {
    ...entry,
    id: uid(),
    timestamp: Date.now(),
  };
  return [...history, full];
}

export function applySelectPiece(
  state: GameSnapshot,
  pieceId: string,
  actingPlayer: PlayerId,
): GameSnapshot {
  if (state.winner !== null || state.draw) return state;
  if (state.currentPhase !== "select_piece" || state.activePlayer !== actingPlayer) {
    return { ...state, lastErrorKey: "invalid_move" };
  }
  const piece = state.pieces.find((p) => p.id === pieceId);
  if (!piece || piece.used) {
    return { ...state, lastErrorKey: "invalid_move" };
  }
  const other: PlayerId = actingPlayer === 1 ? 2 : 1;
  const next: GameSnapshot = {
    ...state,
    selectedPieceId: pieceId,
    currentPhase: "place_piece",
    activePlayer: other,
    lastErrorKey: null,
    moveHistory: appendHistory(state.moveHistory, {
      phase: "select_piece",
      player: actingPlayer,
      pieceId,
    }),
  };
  return next;
}

export function applyPlacePiece(
  state: GameSnapshot,
  row: number,
  col: number,
  actingPlayer: PlayerId,
): GameSnapshot {
  if (state.winner !== null || state.draw) return state;
  if (state.currentPhase !== "place_piece" || state.activePlayer !== actingPlayer) {
    return { ...state, lastErrorKey: "invalid_move" };
  }
  if (!state.selectedPieceId) return { ...state, lastErrorKey: "invalid_move" };
  if (row < 0 || row > 3 || col < 0 || col > 3) return { ...state, lastErrorKey: "invalid_move" };
  if (state.board[row][col] !== null) return { ...state, lastErrorKey: "invalid_move" };

  const board = cloneBoard(state.board);
  board[row][col] = state.selectedPieceId;

  const pieces = clonePieces(state.pieces).map((p) =>
    p.id === state.selectedPieceId ? { ...p, used: true } : p,
  );

  let next: GameSnapshot = {
    ...state,
    board,
    pieces,
    selectedPieceId: null,
    currentPhase: "select_piece",
    activePlayer: actingPlayer,
    lastErrorKey: null,
    moveHistory: appendHistory(state.moveHistory, {
      phase: "place_piece",
      player: actingPlayer,
      pieceId: state.selectedPieceId,
      cell: { row, col },
    }),
  };

  const win = evaluateWin(next.board, next.pieces);
  if (win.win) {
    next = {
      ...next,
      winner: actingPlayer,
      winningCells: win.winningCells,
      matchingAttributes: win.matchingAttributes,
    };
    return next;
  }

  const filled = next.board.every((r) => r.every((c) => c !== null));
  if (filled) {
    return { ...next, draw: true };
  }

  return next;
}

export function hydrateSnapshotFromServer(
  partial: Partial<GameSnapshot> & {
    board: BoardGrid;
    pieces: PieceDefinition[];
    currentPhase: GamePhase;
    activePlayer: PlayerId;
    selectedPieceId: string | null;
    winner: PlayerId | null;
    draw: boolean;
    winningCells: { row: number; col: number }[];
    matchingAttributes: ("color" | "height" | "shape" | "top")[];
    moveHistory: MoveHistoryEntry[];
    opponentOnline?: boolean;
    rematchPendingFrom?: PlayerId | null;
    awaitingOpponent?: boolean;
  },
  current: GameSnapshot,
): GameSnapshot {
  return {
    ...current,
    board: partial.board,
    pieces: partial.pieces,
    currentPhase: partial.currentPhase,
    activePlayer: partial.activePlayer,
    selectedPieceId: partial.selectedPieceId,
    winner: partial.winner,
    draw: partial.draw,
    winningCells: partial.winningCells,
    matchingAttributes: partial.matchingAttributes,
    moveHistory: partial.moveHistory,
    opponentOnline: partial.opponentOnline ?? true,
    rematchPendingFrom: partial.rematchPendingFrom ?? null,
    awaitingOpponent: partial.awaitingOpponent ?? false,
    lastErrorKey: null,
  };
}
