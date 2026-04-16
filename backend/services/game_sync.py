from __future__ import annotations

import itertools
import time
import uuid
from copy import deepcopy
from typing import Any, Literal, Optional

PlayerId = Literal[1, 2]
Phase = Literal["select_piece", "place_piece"]

LINES: list[list[tuple[int, int]]] = []
for r in range(4):
    LINES.append([(r, c) for c in range(4)])
for c in range(4):
    LINES.append([(r, c) for r in range(4)])
LINES.append([(i, i) for i in range(4)])
LINES.append([(i, 3 - i) for i in range(4)])


def generate_pieces() -> list[dict[str, Any]]:
    pieces: list[dict[str, Any]] = []
    idx = 0
    for color in ("light", "dark"):
        for height in ("short", "tall"):
            for shape in ("round", "square"):
                for top in ("solid", "hollow"):
                    pieces.append(
                        {
                            "id": str(idx),
                            "color": color,
                            "height": height,
                            "shape": shape,
                            "top": top,
                            "used": False,
                        }
                    )
                    idx += 1
    return pieces


def empty_board() -> list[list[Optional[str]]]:
    return [[None for _ in range(4)] for _ in range(4)]


def evaluate_win(board: list[list[Optional[str]]], pieces: list[dict[str, Any]]) -> dict[str, Any]:
    by_id = {p["id"]: p for p in pieces}
    for line in LINES:
        ids = [board[r][c] for r, c in line]
        if any(i is None for i in ids):
            continue
        line_pieces = [by_id[i] for i in ids]  # type: ignore[index]
        attrs = ("color", "height", "shape", "top")
        matching: list[str] = []
        for attr in attrs:
            first = line_pieces[0][attr]
            if all(p[attr] == first for p in line_pieces):
                matching.append(attr)
        if matching:
            return {
                "win": True,
                "winningCells": [{"row": r, "col": c} for r, c in line],
                "matchingAttributes": matching,
            }
    return {"win": False, "winningCells": [], "matchingAttributes": []}


def new_game_state(room_id: str) -> dict[str, Any]:
    return {
        "room_id": room_id,
        "board": empty_board(),
        "pieces": generate_pieces(),
        "current_phase": "select_piece",
        "active_player": 1,
        "selected_piece_id": None,
        "winner": None,
        "draw": False,
        "winning_cells": [],
        "matching_attributes": [],
        "move_history": [],
        "rematch_pending_from": None,
    }


def _append_history(state: dict[str, Any], entry: dict[str, Any]) -> None:
    full = {
        **entry,
        "id": str(uuid.uuid4()),
        "timestamp": time.time() * 1000,
    }
    state["move_history"].append(full)


def apply_select_piece(state: dict[str, Any], piece_id: str, acting: PlayerId) -> tuple[bool, Optional[str]]:
    if state.get("winner") is not None or state.get("draw"):
        return False, "game_over"
    if state["current_phase"] != "select_piece" or state["active_player"] != acting:
        return False, "invalid_move"
    piece = next((p for p in state["pieces"] if p["id"] == piece_id), None)
    if piece is None or piece["used"]:
        return False, "invalid_move"
    other: PlayerId = 2 if acting == 1 else 1
    state["selected_piece_id"] = piece_id
    state["current_phase"] = "place_piece"
    state["active_player"] = other
    _append_history(
        state,
        {"phase": "select_piece", "player": acting, "pieceId": piece_id},
    )
    return True, None


def apply_place_piece(state: dict[str, Any], row: int, col: int, acting: PlayerId) -> tuple[bool, Optional[str]]:
    if state.get("winner") is not None or state.get("draw"):
        return False, "game_over"
    if state["current_phase"] != "place_piece" or state["active_player"] != acting:
        return False, "invalid_move"
    sel = state.get("selected_piece_id")
    if not sel:
        return False, "invalid_move"
    if row < 0 or row > 3 or col < 0 or col > 3:
        return False, "invalid_move"
    if state["board"][row][col] is not None:
        return False, "invalid_move"

    state["board"][row][col] = sel
    for p in state["pieces"]:
        if p["id"] == sel:
            p["used"] = True
    state["selected_piece_id"] = None
    state["current_phase"] = "select_piece"
    state["active_player"] = acting
    _append_history(
        state,
        {"phase": "place_piece", "player": acting, "pieceId": sel, "cell": {"row": row, "col": col}},
    )

    win = evaluate_win(state["board"], state["pieces"])
    if win["win"]:
        state["winner"] = acting
        state["winning_cells"] = win["winningCells"]
        state["matching_attributes"] = win["matchingAttributes"]
        return True, None

    filled = all(state["board"][r][c] is not None for r, c in itertools.product(range(4), range(4)))
    if filled:
        state["draw"] = True
    return True, None


def reset_match(state: dict[str, Any]) -> None:
    state["board"] = empty_board()
    state["pieces"] = generate_pieces()
    state["current_phase"] = "select_piece"
    state["active_player"] = 1
    state["selected_piece_id"] = None
    state["winner"] = None
    state["draw"] = False
    state["winning_cells"] = []
    state["matching_attributes"] = []
    state["move_history"] = []
    state["rematch_pending_from"] = None


def public_payload(
    room_id: str,
    state: dict[str, Any],
    opponent_online: bool,
    *,
    awaiting_opponent: bool = False,
) -> dict[str, Any]:
    return {
        "room_id": room_id,
        "board": deepcopy(state["board"]),
        "pieces": deepcopy(state["pieces"]),
        "current_phase": state["current_phase"],
        "active_player": state["active_player"],
        "selected_piece_id": state["selected_piece_id"],
        "winner": state["winner"],
        "draw": state["draw"],
        "winning_cells": state.get("winning_cells", []),
        "matching_attributes": state.get("matching_attributes", []),
        "move_history": deepcopy(state.get("move_history", [])),
        "opponent_online": opponent_online,
        "rematch_pending_from": state.get("rematch_pending_from"),
        "awaiting_opponent": awaiting_opponent,
    }
