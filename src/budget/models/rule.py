import uuid

from pydantic import BaseModel


def _generate_id() -> str:
    return uuid.uuid4().hex[:8]


class Rule(BaseModel):
    id: str
    pattern: str   # regex applied to transaction description
    label_id: str  # tier-3 label id to apply
