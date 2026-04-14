from pydantic import BaseModel


class Label(BaseModel):
    name: str
    color: str  # hexadecimal color code, e.g. "#ff5733"
