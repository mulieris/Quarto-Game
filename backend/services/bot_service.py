"""Optional server-side bot suggestions (MVP heuristic)."""

from __future__ import annotations

import random
from typing import Any, Literal

from services import game_sync

Difficulty = Literal["easy", "medium", "hard"]


def _unused_piece_ids(pieces: list[dict[str, Any]]) -> list[str]:
    return [p["id"] for p in pieces if not p["used"]]


def _legal_cells(board: list[list[Any]]) -> list[tuple[int, int]]:
    out: list[tuple[int, int]] = []
    for r in range(4):
        for c in range(4):
            if board[r][c] is None:
                out.append((r, c))
    return out


def _clone_state(state: dict[str, Any]) -> dict[str, Any]:
    import copy

    return copy.deepcopy(state)


def _after_select(state: dict[str, Any], piece_id: str, acting: int) -> dict[str, Any]:
    s = _clone_state(state)
    ok, _ = game_sync.apply_select_piece(s, piece_id, acting)  # type: ignore[arg-type]
    return s if ok else state


def _after_place(state: dict[str, Any], row: int, col: int, acting: int) -> dict[str, Any]:
    s = _clone_state(state)
    ok, _ = game_sync.apply_place_piece(s, row, col, acting)  # type: ignore[arg-type]
    return s if ok else state


def _player_wins_if_placed(state: dict[str, Any], piece_id: str, row: int, col: int, player: int) -> bool:
    after = _after_place(state, row, col, player)
    return after.get("winner") == player


def suggest_bot_move(state: dict[str, Any], bot_seat: int, difficulty: Difficulty = "medium") -> dict[str, Any]:
    human = 2 if bot_seat == 1 else 1
    phase = state["current_phase"]
    if phase == "select_piece" and state["active_player"] == bot_seat:
        ids = _unused_piece_ids(state["pieces"])
        if not ids:
            return {"action": "noop"}
        if difficulty == "easy":
            return {"action": "select_piece", "piece_id": random.choice(ids)}
        safe = []
        for pid in ids:
            after = _after_select(state, pid, bot_seat)
            if after["current_phase"] != "place_piece" or after["active_player"] != human:
                continue
            sel = after.get("selected_piece_id")
            if not sel:
                continue
            human_can = any(_player_wins_if_placed(after, sel, r, c, human) for r, c in _legal_cells(after["board"]))
            if not human_can:
                safe.append(pid)
        pool = safe or ids
        return {"action": "select_piece", "piece_id": random.choice(pool)}
    if phase == "place_piece" and state["active_player"] == bot_seat:
        sel = state.get("selected_piece_id")
        if not sel:
            return {"action": "noop"}
        cells = _legal_cells(state["board"])
        wins = [(r, c) for r, c in cells if _player_wins_if_placed(state, sel, r, c, bot_seat)]
        if wins:
            r, c = random.choice(wins)
            return {"action": "place_piece", "row": r, "col": c}
        if difficulty == "easy":
            r, c = random.choice(cells)
            return {"action": "place_piece", "row": r, "col": c}
        non_losing = [
            (r, c)
            for r, c in cells
            if _after_place(state, r, c, bot_seat).get("winner") != human
        ]
        pool = non_losing or cells
        r, c = random.choice(pool)
        return {"action": "place_piece", "row": r, "col": c}
    return {"action": "noop"}
