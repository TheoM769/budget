import uuid
from enum import IntEnum
from typing import Optional

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
    parent_id: Optional[str] = None
    color: Optional[str] = None  # only tier 2 labels have a color
