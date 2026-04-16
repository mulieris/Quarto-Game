import { create } from "zustand";
import {
  applyPlacePiece,
  applySelectPiece,
  createInitialSnapshot,
  hydrateSnapshotFromServer,
  snapshotForNewGame,
  type GameSnapshot,
} from "@/logic/gameEngine";
import type { PlayerId } from "@/logic/quartoTypes";
import { chooseBotPiece, chooseBotPlacement, type BotDifficulty } from "@/logic/botEngine";
import { sendSocket } from "@/network/socketClient";
import { sounds } from "@/audio/soundManager";

export type { GameSnapshot };

interface OnlineCredentials {
  roomId: string;
  playerSecret: string;
  mySeat: PlayerId;
}

interface GameStoreState extends GameSnapshot {
  online: OnlineCredentials | null;
  botDifficulty: BotDifficulty;
  soundEnabled: boolean;
  setBotDifficulty: (d: BotDifficulty) => void;
  setSoundEnabled: (v: boolean) => void;
  attachOnlineSocket: (ws: WebSocket | null) => void;
  resetToMenu: () => void;
  startLocal: () => void;
  startBot: (human: PlayerId, difficulty: BotDifficulty) => void;
  seedOnlineLobby: (roomId: string, secret: string, seat: PlayerId) => void;
  applyServerPayload: (payload: Record<string, unknown>) => void;
  selectPiece: (pieceId: string) => void;
  placePiece: (row: number, col: number) => void;
  requestRematch: () => void;
  clearError: () => void;
  setBotThinkingFlag: (v: boolean) => void;
  runBotIfNeeded: () => void;
}

function storeToSnapshot(s: GameStoreState): GameSnapshot {
  return {
    mode: s.mode,
    currentPhase: s.currentPhase,
    activePlayer: s.activePlayer,
    selectedPieceId: s.selectedPieceId,
    board: s.board,
    pieces: s.pieces,
    winner: s.winner,
    draw: s.draw,
    winningCells: s.winningCells,
    matchingAttributes: s.matchingAttributes,
    moveHistory: s.moveHistory,
    roomId: s.roomId,
    connectionStatus: s.connectionStatus,
    lastErrorKey: s.lastErrorKey,
    botThinking: s.botThinking,
    humanPlayer: s.humanPlayer,
    myPlayer: s.myPlayer,
    opponentOnline: s.opponentOnline,
    rematchPendingFrom: s.rematchPendingFrom,
    awaitingOpponent: s.awaitingOpponent,
  };
}

let onlineSocket: WebSocket | null = null;

export function canUserActFromSnapshot(snapshot: GameSnapshot): boolean {
  if (snapshot.mode === "menu") return false;
  if (snapshot.mode === "local") return true;
  if (snapshot.mode === "bot") {
    return snapshot.activePlayer === snapshot.humanPlayer && !snapshot.botThinking;
  }
  if (snapshot.mode === "online") {
    if (snapshot.myPlayer === null) return false;
    if (snapshot.awaitingOpponent) return false;
    if (!snapshot.opponentOnline) return false;
    return snapshot.activePlayer === snapshot.myPlayer;
  }
  return false;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  ...createInitialSnapshot(),
  online: null,
  botDifficulty: "medium",
  soundEnabled: true,

  setBotDifficulty: (botDifficulty) => set({ botDifficulty }),
  setSoundEnabled: (soundEnabled) => set({ soundEnabled }),

  attachOnlineSocket: (ws) => {
    onlineSocket = ws;
  },

  resetToMenu: () => {
    onlineSocket = null;
    set({
      ...createInitialSnapshot(),
      online: null,
      botDifficulty: get().botDifficulty,
      soundEnabled: get().soundEnabled,
    });
  },

  startLocal: () => {
    onlineSocket = null;
    set({
      ...snapshotForNewGame(createInitialSnapshot()),
      mode: "local",
      myPlayer: null,
      humanPlayer: 1,
      online: null,
      connectionStatus: "idle",
      botDifficulty: get().botDifficulty,
      soundEnabled: get().soundEnabled,
    });
  },

  startBot: (human, difficulty) => {
    onlineSocket = null;
    set({
      ...snapshotForNewGame(createInitialSnapshot()),
      mode: "bot",
      humanPlayer: human,
      myPlayer: human,
      online: null,
      connectionStatus: "idle",
      botDifficulty: difficulty,
      soundEnabled: get().soundEnabled,
    });
    queueMicrotask(() => get().runBotIfNeeded());
  },

  seedOnlineLobby: (roomId, playerSecret, seat) => {
    set({
      ...snapshotForNewGame(createInitialSnapshot()),
      mode: "online",
      roomId,
      myPlayer: seat,
      humanPlayer: seat,
      online: { roomId, playerSecret, mySeat: seat },
      connectionStatus: "connecting",
      botDifficulty: get().botDifficulty,
      soundEnabled: get().soundEnabled,
    });
  },

  applyServerPayload: (payload) => {
    const cur = get();
    const next = hydrateSnapshotFromServer(
      {
        board: payload.board as GameSnapshot["board"],
        pieces: payload.pieces as GameSnapshot["pieces"],
        currentPhase: payload.current_phase as GameSnapshot["currentPhase"],
        activePlayer: Number(payload.active_player) as PlayerId,
        selectedPieceId: (payload.selected_piece_id as string | null) ?? null,
        winner: (payload.winner as PlayerId | null) ?? null,
        draw: Boolean(payload.draw),
        winningCells: (payload.winning_cells as GameSnapshot["winningCells"]) ?? [],
        matchingAttributes:
          (payload.matching_attributes as GameSnapshot["matchingAttributes"]) ?? [],
        moveHistory: (payload.move_history as GameSnapshot["moveHistory"]) ?? [],
        opponentOnline: payload.opponent_online !== false,
        rematchPendingFrom: (payload.rematch_pending_from as PlayerId | null) ?? null,
        awaitingOpponent: Boolean(payload.awaiting_opponent),
      },
      { ...storeToSnapshot(cur), mode: "online" },
    );
    set({
      ...next,
      mode: "online",
      roomId: (payload.room_id as string) ?? cur.roomId,
      connectionStatus: "connected",
      lastErrorKey: null,
    });
  },

  clearError: () => set({ lastErrorKey: null }),

  selectPiece: (pieceId) => {
    const s = get();
    if (s.winner !== null || s.draw) return;
    if (s.mode === "online") {
      if (!canUserActFromSnapshot(s)) return;
      sendSocket(onlineSocket, { type: "select_piece", piece_id: pieceId });
      return;
    }
    if (!canUserActFromSnapshot(s)) return;
    const acting = s.activePlayer;
    const before = s.selectedPieceId;
    const next = applySelectPiece(storeToSnapshot(s), pieceId, acting);
    if (next.lastErrorKey) {
      if (s.soundEnabled) sounds.error();
      set({ lastErrorKey: next.lastErrorKey });
      return;
    }
    if (s.soundEnabled && before !== next.selectedPieceId) sounds.tap();
    set({ ...next, soundEnabled: s.soundEnabled, botDifficulty: s.botDifficulty });
    queueMicrotask(() => get().runBotIfNeeded());
  },

  placePiece: (row, col) => {
    const s = get();
    if (s.winner !== null || s.draw) return;
    if (s.mode === "online") {
      if (!canUserActFromSnapshot(s)) return;
      sendSocket(onlineSocket, { type: "place_piece", row, col });
      return;
    }
    const acting = s.activePlayer;
    if (!canUserActFromSnapshot(s)) return;
    const next = applyPlacePiece(storeToSnapshot(s), row, col, acting);
    if (next.lastErrorKey) {
      if (s.soundEnabled) sounds.error();
      set({ lastErrorKey: next.lastErrorKey });
      return;
    }
    if (s.soundEnabled) sounds.place();
    if (next.winner !== null && s.soundEnabled) sounds.win();
    set({ ...next, soundEnabled: s.soundEnabled, botDifficulty: s.botDifficulty });
    queueMicrotask(() => get().runBotIfNeeded());
  },

  requestRematch: () => {
    const s = get();
    if (s.mode === "online") {
      sendSocket(onlineSocket, { type: "rematch" });
      return;
    }
    if (s.winner === null && !s.draw) return;
    set({
      ...snapshotForNewGame(storeToSnapshot(s)),
      mode: s.mode,
      humanPlayer: s.humanPlayer,
      myPlayer: s.myPlayer,
      online: s.online,
      connectionStatus: s.connectionStatus,
      botDifficulty: s.botDifficulty,
      soundEnabled: s.soundEnabled,
    });
    queueMicrotask(() => get().runBotIfNeeded());
  },

  setBotThinkingFlag: (botThinking) => set({ botThinking }),

  runBotIfNeeded: () => {
    const s = get();
    if (s.mode !== "bot") return;
    const human = s.humanPlayer;
    const bot: PlayerId = human === 1 ? 2 : 1;
    const diff = s.botDifficulty;
    if (s.winner !== null || s.draw) return;

    if (s.activePlayer === bot) {
      set({ botThinking: true });
      window.setTimeout(() => {
        const live = get();
        if (live.mode !== "bot" || live.activePlayer !== bot) {
          set({ botThinking: false });
          return;
        }
        if (live.currentPhase === "select_piece") {
          const pid = chooseBotPiece(live, bot, diff);
          const next = applySelectPiece(storeToSnapshot(live), pid, bot);
          if (live.soundEnabled) sounds.tap();
          set({ ...next, botThinking: false, soundEnabled: live.soundEnabled, botDifficulty: live.botDifficulty });
        } else if (live.currentPhase === "place_piece") {
          const { row, col } = chooseBotPlacement(live, bot, diff);
          const next = applyPlacePiece(storeToSnapshot(live), row, col, bot);
          if (live.soundEnabled) sounds.place();
          if (next.winner !== null && live.soundEnabled) sounds.win();
          set({ ...next, botThinking: false, soundEnabled: live.soundEnabled, botDifficulty: live.botDifficulty });
        } else {
          set({ botThinking: false });
        }
        queueMicrotask(() => get().runBotIfNeeded());
      }, 420);
    } else {
      set({ botThinking: false });
    }
  },
}));

export function setGameConnectionStatus(status: GameSnapshot["connectionStatus"]) {
  useGameStore.setState({ connectionStatus: status });
}
