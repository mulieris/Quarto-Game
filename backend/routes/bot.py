from __future__ import annotations

from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict, Field

from services.bot_service import suggest_bot_move

router = APIRouter(prefix="/bot", tags=["bot"])


class BotSuggestRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    state: dict
    bot_seat: Literal[1, 2] = Field(alias="botSeat")
    difficulty: Literal["easy", "medium", "hard"] = "medium"


@router.post("/suggest")
async def bot_suggest(body: BotSuggestRequest):
    return suggest_bot_move(body.state, body.bot_seat, body.difficulty)
