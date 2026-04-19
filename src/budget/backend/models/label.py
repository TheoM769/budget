from enum import IntEnum
from typing import Optional

from pydantic import BaseModel


class Tier(IntEnum):
    ONE = 1
    TWO = 2
    THREE = 3


class Label(BaseModel):
    id: str
    name: str
    tier: Tier
    parent_id: Optional[str] = None
    color: Optional[str] = None  # only tier-2 labels carry a color
