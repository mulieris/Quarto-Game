from __future__ import annotations

import secrets
import string
from dataclasses import dataclass, field
from typing import Any, Optional

from fastapi import WebSocket

from services import game_sync

ALPHABET = string.ascii_lowercase + string.digits


def make_room_id(length: int = 8) -> str:
    return "".join(secrets.choice(ALPHABET) for _ in range(length))


def make_secret() -> str:
    return secrets.token_urlsafe(24)


@dataclass
class PlayerSlot:
    secret: str
    socket: Optional[WebSocket] = None


@dataclass
class Room:
    id: str
    game: dict[str, Any]
    players: dict[int, PlayerSlot] = field(default_factory=dict)

    def both_connected(self) -> bool:
        if len(self.players) < 2:
            return False
        return all(p.socket is not None for p in self.players.values())

    def opponent_online(self, seat: int) -> bool:
        other = 2 if seat == 1 else 1
        slot = self.players.get(other)
        return slot is not None and slot.socket is not None


class RoomManager:
    def __init__(self) -> None:
        self._rooms: dict[str, Room] = {}

    def get_room(self, room_id: str) -> Optional[Room]:
        return self._rooms.get(room_id)

    def create_room(self) -> tuple[str, str]:
        for _ in range(20):
            rid = make_room_id()
            if rid not in self._rooms:
                room = Room(id=rid, game=game_sync.new_game_state(rid))
                host_secret = make_secret()
                room.players[1] = PlayerSlot(secret=host_secret)
                self._rooms[rid] = room
                return rid, host_secret
        raise RuntimeError("could_not_allocate_room")

    def join_room(self, room_id: str) -> tuple[str, str]:
        room = self._rooms.get(room_id)
        if room is None:
            raise KeyError("not_found")
        if 2 in room.players:
            raise ValueError("room_full")
        guest_secret = make_secret()
        room.players[2] = PlayerSlot(secret=guest_secret)
        return guest_secret

    def get_room_for_secret(self, room_id: str, secret: str) -> tuple[Room, int]:
        room = self._rooms.get(room_id)
        if room is None:
            raise KeyError("not_found")
        for seat, slot in room.players.items():
            if slot.secret == secret:
                return room, seat
        raise PermissionError("bad_secret")

    def attach_socket(self, room_id: str, secret: str, ws: WebSocket) -> tuple[Room, int]:
        room, seat = self.get_room_for_secret(room_id, secret)
        room.players[seat].socket = ws
        return room, seat

    def detach_socket(self, room_id: str, secret: str) -> tuple[Room, int]:
        room, seat = self.get_room_for_secret(room_id, secret)
        room.players[seat].socket = None
        return room, seat


manager = RoomManager()
