import type { GameSnapshot, PieceDefinition, PlayerId } from "./quartoTypes";
import { applyPlacePiece, applySelectPiece } from "./gameEngine";

export type BotDifficulty = "easy" | "medium" | "hard";

function cloneState(state: GameSnapshot): GameSnapshot {
  return structuredClone(state);
}

function unusedIds(pieces: PieceDefinition[]): string[] {
  return pieces.filter((p) => !p.used).map((p) => p.id);
}

function hypotheticalAfterPlace(
  state: GameSnapshot,
  row: number,
  col: number,
  actingPlayer: PlayerId,
): GameSnapshot {
  return applyPlacePiece(cloneState(state), row, col, actingPlayer);
}

function hypotheticalAfterSelect(state: GameSnapshot, pieceId: string, acting: PlayerId): GameSnapshot {
  return applySelectPiece(cloneState(state), pieceId, acting);
}

function playerWinsIfPlaced(state: GameSnapshot, _pieceId: string, row: number, col: number, player: PlayerId): boolean {
  const after = hypotheticalAfterPlace(state, row, col, player);
  return after.winner === player;
}

function legalCells(state: GameSnapshot): { row: number; col: number }[] {
  const cells: { row: number; col: number }[] = [];
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 4; c += 1) {
      if (state.board[r][c] === null) cells.push({ row: r, col: c });
    }
  }
  return cells;
}

function scoreSelect(state: GameSnapshot, pieceId: string, botPlayer: PlayerId): number {
  const human: PlayerId = botPlayer === 1 ? 2 : 1;
  const afterSelect = hypotheticalAfterSelect(state, pieceId, botPlayer);
  if (afterSelect.currentPhase !== "place_piece" || afterSelect.activePlayer !== human) return 0;

  let worst = Infinity;
  for (const cell of legalCells(afterSelect)) {
    if (!afterSelect.selectedPieceId) continue;
    if (playerWinsIfPlaced(afterSelect, afterSelect.selectedPieceId, cell.row, cell.col, human)) {
      worst = -Infinity;
      break;
    }
    let bestReply = -Infinity;
    const afterHumanPlace = hypotheticalAfterPlace(afterSelect, cell.row, cell.col, human);
    if (afterHumanPlace.winner === human) {
      worst = -Infinity;
      break;
    }
    const ids = unusedIds(afterHumanPlace.pieces);
    for (const give of ids) {
      const afterGive = hypotheticalAfterSelect(afterHumanPlace, give, human);
      if (afterGive.currentPhase !== "place_piece" || afterGive.activePlayer !== botPlayer) continue;
      if (!afterGive.selectedPieceId) continue;
      for (const botCell of legalCells(afterGive)) {
        const fin = hypotheticalAfterPlace(afterGive, botCell.row, botCell.col, botPlayer);
        let val = 0;
        if (fin.winner === botPlayer) val += 100;
        else if (fin.draw) val += 1;
        if (val > bestReply) bestReply = val;
      }
    }
    if (bestReply < worst) worst = bestReply;
  }
  return worst === Infinity ? 0 : worst;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export function chooseBotPiece(state: GameSnapshot, botPlayer: PlayerId, difficulty: BotDifficulty): string {
  const ids = unusedIds(state.pieces);
  if (ids.length === 0) return "0";

  if (difficulty === "easy") {
    return pickRandom(ids);
  }

  const human: PlayerId = botPlayer === 1 ? 2 : 1;

  const safe: string[] = [];
  for (const pid of ids) {
    const afterSel = hypotheticalAfterSelect(state, pid, botPlayer);
    if (afterSel.currentPhase !== "place_piece" || afterSel.activePlayer !== human) continue;
    let humanCanWin = false;
    for (const cell of legalCells(afterSel)) {
      if (!afterSel.selectedPieceId) continue;
      if (playerWinsIfPlaced(afterSel, afterSel.selectedPieceId, cell.row, cell.col, human)) {
        humanCanWin = true;
        break;
      }
    }
    if (!humanCanWin) safe.push(pid);
  }
  const pool = safe.length > 0 ? safe : ids;

  if (difficulty === "medium") {
    let best = pool[0]!;
    let bestScore = scoreSelect(state, best, botPlayer);
    for (const pid of pool) {
      const s = scoreSelect(state, pid, botPlayer);
      if (s > bestScore) {
        bestScore = s;
        best = pid;
      }
    }
    return best;
  }

  let best = pool[0]!;
  let bestScore = scoreSelect(state, best, botPlayer);
  for (const pid of pool) {
    const s = scoreSelect(state, pid, botPlayer);
    if (s > bestScore) {
      bestScore = s;
      best = pid;
    }
  }
  return best;
}

export function chooseBotPlacement(
  state: GameSnapshot,
  botPlayer: PlayerId,
  difficulty: BotDifficulty,
): { row: number; col: number } {
  const cells = legalCells(state);
  if (cells.length === 0) return { row: 0, col: 0 };
  const sel = state.selectedPieceId;
  if (!sel) return pickRandom(cells);

  const winning = cells.filter((c) => playerWinsIfPlaced(state, sel, c.row, c.col, botPlayer));
  if (winning.length > 0) return pickRandom(winning);

  if (difficulty === "easy") {
    return pickRandom(cells);
  }

  const human: PlayerId = botPlayer === 1 ? 2 : 1;
  const nonLosing = cells.filter((c) => {
    const after = hypotheticalAfterPlace(state, c.row, c.col, botPlayer);
    if (after.winner === human) return false;
    return true;
  });
  const pool = nonLosing.length > 0 ? nonLosing : cells;

  let best = pool[0]!;
  let bestScore = -Infinity;
  for (const c of pool) {
    const after = hypotheticalAfterPlace(state, c.row, c.col, botPlayer);
    let score = 0;
    if (after.winner === botPlayer) score += 200;
    if (after.draw) score += 2;
    const ids = unusedIds(after.pieces);
    let minHumanThreat = Infinity;
    for (const give of ids) {
      const afterSel = hypotheticalAfterSelect(after, give, botPlayer);
      if (afterSel.currentPhase !== "place_piece" || afterSel.activePlayer !== human) continue;
      let maxHuman = 0;
      for (const hCell of legalCells(afterSel)) {
        if (!afterSel.selectedPieceId) continue;
        if (playerWinsIfPlaced(afterSel, afterSel.selectedPieceId, hCell.row, hCell.col, human)) {
          maxHuman = 100;
          break;
        }
      }
      if (maxHuman < minHumanThreat) minHumanThreat = maxHuman;
    }
    score -= minHumanThreat;
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}
