import uuid
from enum import IntEnum

from pydantic import BaseModel


def _generate_id() -> str:
    return uuid.uuid4().hex[:8]


class Tier(IntEnum):
    ONE = 1
    TWO = 2
    THREE = 3


class Label(BaseModel):
    id: str
    name: str
    tier: Tier
    parent_id: str | None = None
    color: str | None = None  # only tier 2 labels have a color
    mandatory: bool = False  # only tier 3 labels use this
