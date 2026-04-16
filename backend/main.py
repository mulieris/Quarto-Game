from __future__ import annotations

import json
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from routes import bot as bot_routes
from routes import rooms as rooms_routes
from services.room_manager import manager as room_manager
from websocket.connection_manager import ConnectionBroadcaster, handle_client_message

app = FastAPI(title="Quarto Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rooms_routes.router, prefix="/api")
app.include_router(bot_routes.router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}


broadcaster = ConnectionBroadcaster(room_manager)


@app.websocket("/ws/rooms/{room_id}")
async def room_socket(room_id: str, websocket: WebSocket, player_secret: str):
    await websocket.accept()
    try:
        room, seat = room_manager.attach_socket(room_id, player_secret, websocket)
    except (KeyError, PermissionError):
        await websocket.close(code=4403)
        return

    import services.game_sync as game_sync

    awaiting = len(room.players) < 2
    payload = game_sync.public_payload(
        room_id,
        room.game,
        opponent_online=room.opponent_online(seat),
        awaiting_opponent=awaiting,
    )
    await websocket.send_text(json.dumps({"type": "state", "payload": payload}))
    await broadcaster.broadcast_state(room_id)

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({"type": "error", "code": "bad_json"}))
                continue
            if not isinstance(data, dict):
                continue
            await handle_client_message(room_manager, broadcaster, room_id, seat, data)
    except WebSocketDisconnect:
        room_manager.detach_socket(room_id, player_secret)
        await broadcaster.broadcast_state(room_id)
