from __future__ import annotations

from pydantic import BaseModel


class RemoveRequest(BaseModel):
    ids: str | list[str]


class ModifyRequest(BaseModel):
    ids: str | list[str]
    description: str | None = None
    label: str | None = None
