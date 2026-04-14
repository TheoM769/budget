from pydantic import BaseModel
from typing import Optional

class RemoveRequest(BaseModel):
    ids: str | list[str]


class ModifyRequest(BaseModel):
    ids: str | list[str]
    description: Optional[str] = None
    label: Optional[str] = None