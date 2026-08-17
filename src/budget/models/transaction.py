import datetime

from pydantic import BaseModel


class Transaction(BaseModel):
    id: str
    date: datetime.date
    description: str
    amount: float
    label_id: str = ""