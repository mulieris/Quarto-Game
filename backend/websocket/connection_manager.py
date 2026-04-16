from __future__ import annotations

import json
from typing import Any

from fastapi import WebSocket

from services import game_sync
from services.room_manager import RoomManager


class ConnectionBroadcaster:
    def __init__(self, rooms: RoomManager) -> None:
        self.rooms = rooms

    async def broadcast_state(self, room_id: str) -> None:
        room = self.rooms.get_room(room_id)
        if room is None:
            return
        for seat, slot in room.players.items():
            ws = slot.socket
            if ws is None:
                continue
            awaiting = len(room.players) < 2
            payload = game_sync.public_payload(
                room_id,
                room.game,
                opponent_online=room.opponent_online(seat),
                awaiting_opponent=awaiting,
            )
            await ws.send_text(json.dumps({"type": "state", "payload": payload}))


async def handle_client_message(
    rooms: RoomManager,
    broadcaster: ConnectionBroadcaster,
    room_id: str,
    seat: int,
    data: dict[str, Any],
) -> None:
    room = rooms.get_room(room_id)
    if room is None:
        return
    msg_type = data.get("type")
    acting: int = seat  # type: ignore[assignment]

    if msg_type in ("select_piece", "place_piece") and not room.both_connected():
        await _send_error(room, seat, "waiting_opponent")
        return

    if msg_type == "select_piece":
        piece_id = str(data.get("piece_id", ""))
        ok, err = game_sync.apply_select_piece(room.game, piece_id, acting)  # type: ignore[arg-type]
        if not ok:
            await _send_error(room, seat, err or "invalid_move")
            return
        await broadcaster.broadcast_state(room_id)
        return

    if msg_type == "place_piece":
        row = int(data.get("row", -1))
        col = int(data.get("col", -1))
        ok, err = game_sync.apply_place_piece(room.game, row, col, acting)  # type: ignore[arg-type]
        if not ok:
            await _send_error(room, seat, err or "invalid_move")
            return
        await broadcaster.broadcast_state(room_id)
        return

    if msg_type == "rematch":
        if room.game.get("winner") is None and not room.game.get("draw"):
            await _send_error(room, seat, "invalid_move")
            return
        game_sync.reset_match(room.game)
        await broadcaster.broadcast_state(room_id)
        return


async def _send_error(room, seat: int, code: str) -> None:
    slot = room.players.get(seat)
    if slot and slot.socket:
        import json

        await slot.socket.send_text(json.dumps({"type": "error", "code": code}))
