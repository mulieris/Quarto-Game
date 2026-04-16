export type PieceColor = "light" | "dark";
export type PieceHeight = "short" | "tall";
export type PieceShape = "round" | "square";
export type PieceTop = "solid" | "hollow";

export type GameMode = "menu" | "local" | "bot" | "online";
export type GamePhase = "select_piece" | "place_piece";

export type PlayerId = 1 | 2;

export interface PieceDefinition {
  id: string;
  color: PieceColor;
  height: PieceHeight;
  shape: PieceShape;
  top: PieceTop;
  used: boolean;
}

export type BoardCell = string | null;
export type BoardGrid = [
  [BoardCell, BoardCell, BoardCell, BoardCell],
  [BoardCell, BoardCell, BoardCell, BoardCell],
  [BoardCell, BoardCell, BoardCell, BoardCell],
  [BoardCell, BoardCell, BoardCell, BoardCell],
];

export interface MoveHistoryEntry {
  id: string;
  phase: GamePhase;
  player: PlayerId;
  pieceId?: string;
  cell?: { row: number; col: number };
  timestamp: number;
}

export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "error"
  | "room_full";

export interface WinResult {
  win: boolean;
  winningCells: { row: number; col: number }[];
  matchingAttributes: ("color" | "height" | "shape" | "top")[];
}

export interface GameSnapshot {
  mode: GameMode;
  currentPhase: GamePhase;
  /** Player who must act in the current phase */
  activePlayer: PlayerId;
  selectedPieceId: string | null;
  board: BoardGrid;
  pieces: PieceDefinition[];
  winner: PlayerId | null;
  draw: boolean;
  winningCells: { row: number; col: number }[];
  matchingAttributes: ("color" | "height" | "shape" | "top")[];
  moveHistory: MoveHistoryEntry[];
  roomId: string | null;
  connectionStatus: ConnectionStatus;
  lastErrorKey: string | null;
  botThinking: boolean;
  /** Human seat in bot mode */
  humanPlayer: PlayerId;
  /** Online: this client's seat */
  myPlayer: PlayerId | null;
  /** Opponent socket disconnected (online) */
  opponentOnline: boolean;
  rematchPendingFrom: PlayerId | null;
  /** Online: second player has not joined yet */
  awaitingOpponent: boolean;
}
