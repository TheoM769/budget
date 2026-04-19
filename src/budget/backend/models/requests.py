from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class RemoveRequest(BaseModel):
    ids: str | list[str]


class ModifyRequest(BaseModel):
    ids: str | list[str]
    description: Optional[str] = None
    label: Optional[str] = None
