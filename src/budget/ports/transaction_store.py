from abc import ABC, abstractmethod

from ..models import Transaction


class TransactionStore(ABC):
    @abstractmethod
    def read(self) -> list[Transaction]:
        pass

    @abstractmethod
    def write(self, transactions: list[Transaction]) -> list[Transaction]:
        pass
