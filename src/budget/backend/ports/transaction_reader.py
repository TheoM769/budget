from abc import ABC, abstractmethod

from ..models.transaction import Transaction


class TransactionReader(ABC):
    @abstractmethod
    def read_transactions(self, content: str) -> list[Transaction]:
        """Parse raw file content into transactions."""
