from pydantic import BaseModel


class Rule(BaseModel):
    id: str
    pattern: str   # regex matched against transaction description
    label_id: str  # tier-3 label id to apply on match
