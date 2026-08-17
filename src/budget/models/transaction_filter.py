import re
from datetime import date
from enum import Enum

from pydantic import BaseModel

from .transaction import Transaction


class AmountOp(str, Enum):
    gt = "gt"
    ge = "ge"
    lt = "lt"
    le = "le"
    eq = "eq"


class AmountFilter(BaseModel):
    op: AmountOp
    value: float


class TransactionFilter(BaseModel):
    date_from: date | None = None
    date_to: date | None = None
    description: str | None = None
    amount: AmountFilter | None = None

    def apply(self, transactions: list[Transaction]) -> list[Transaction]:
        result = transactions

        if self.date_from is not None:
            result = [tx for tx in result if tx.date >= self.date_from]

        if self.date_to is not None:
            result = [tx for tx in result if tx.date <= self.date_to]

        if self.description is not None:
            pattern = re.compile(self.description)
            result = [tx for tx in result if pattern.search(tx.description)]

        if self.amount is not None:
            op = self.amount.op
            val = self.amount.value
            ops = {
                AmountOp.gt: lambda a: a > val,
                AmountOp.ge: lambda a: a >= val,
                AmountOp.lt: lambda a: a < val,
                AmountOp.le: lambda a: a <= val,
                AmountOp.eq: lambda a: a == val,
            }
            check = ops[op]
            result = [tx for tx in result if check(tx.amount)]

        return result
