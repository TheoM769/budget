from abc import ABC, abstractmethod

from ..models import Transaction


class TransactionReader(ABC):
    @abstractmethod
    def read_transactions(self) -> list[Transaction]:
        pass
