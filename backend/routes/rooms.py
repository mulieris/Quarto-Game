from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from services import game_sync
from services.room_manager import manager as room_manager

router = APIRouter(prefix="/rooms", tags=["rooms"])


@router.post("")
async def create_room():
    try:
        room_id, secret = room_manager.create_room()
    except RuntimeError:
        raise HTTPException(status_code=500, detail="room_create_failed")
    return {"room_id": room_id, "player_secret": secret, "seat": 1}


@router.post("/{room_id}/join")
async def join_room(room_id: str):
    try:
        secret = room_manager.join_room(room_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="room_not_found")
    except ValueError:
        raise HTTPException(status_code=409, detail="room_full")
    return {"room_id": room_id, "player_secret": secret, "seat": 2}


@router.get("/{room_id}")
async def get_room(room_id: str, player_secret: str = Query(..., alias="player_secret")):
    try:
        room, seat = room_manager.get_room_for_secret(room_id, player_secret)
    except KeyError:
        raise HTTPException(status_code=404, detail="room_not_found")
    except PermissionError:
        raise HTTPException(status_code=403, detail="forbidden")
    awaiting = len(room.players) < 2
    payload = game_sync.public_payload(
        room_id,
        room.game,
        opponent_online=room.opponent_online(seat),
        awaiting_opponent=awaiting,
    )
    payload["my_seat"] = seat
    return payload
