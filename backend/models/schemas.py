from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field

PieceColor = Literal["light", "dark"]
PieceHeight = Literal["short", "tall"]
PieceShape = Literal["round", "square"]
PieceTop = Literal["solid", "hollow"]
GamePhase = Literal["select_piece", "place_piece"]
PlayerId = Literal[1, 2]


class PieceModel(BaseModel):
    id: str
    color: PieceColor
    height: PieceHeight
    shape: PieceShape
    top: PieceTop
    used: bool


class MoveHistoryEntryModel(BaseModel):
    id: str
    phase: GamePhase
    player: PlayerId
    piece_id: Optional[str] = Field(default=None, alias="pieceId")
    cell: Optional[dict] = None
    timestamp: float

    class Config:
        populate_by_name = True


class PublicGameState(BaseModel):
    room_id: str
    board: list[list[Optional[str]]]
    pieces: list[PieceModel]
    current_phase: GamePhase = Field(alias="currentPhase")
    active_player: PlayerId = Field(alias="activePlayer")
    selected_piece_id: Optional[str] = Field(default=None, alias="selectedPieceId")
    winner: Optional[PlayerId] = None
    draw: bool = False
    winning_cells: list[dict] = Field(default_factory=list, alias="winningCells")
    matching_attributes: list[str] = Field(default_factory=list, alias="matchingAttributes")
    move_history: list[MoveHistoryEntryModel] = Field(default_factory=list, alias="moveHistory")
    opponent_online: bool = Field(default=True, alias="opponentOnline")
    rematch_pending_from: Optional[PlayerId] = Field(default=None, alias="rematchPendingFrom")

    class Config:
        populate_by_name = True


class CreateRoomResponse(BaseModel):
    room_id: str = Field(alias="roomId")
    player_secret: str = Field(alias="playerSecret")
    seat: PlayerId

    class Config:
        populate_by_name = True


class JoinRoomResponse(BaseModel):
    room_id: str = Field(alias="roomId")
    player_secret: str = Field(alias="playerSecret")
    seat: PlayerId

    class Config:
        populate_by_name = True
