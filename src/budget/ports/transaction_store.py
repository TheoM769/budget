from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Optional

from ..models import Transaction


class TransactionStore(ABC):
    @abstractmethod
    def read(self) -> list[Transaction]:
        pass

    @abstractmethod
    def write(self, transactions: list[Transaction]) -> list[Transaction]:
        pass

    @abstractmethod
    def remove(self, ids: str | list[str]) -> list[Transaction]:
        """Remove transactions by id(s). Returns the removed transactions."""
        pass

    @abstractmethod
    def modify(
        self,
        ids: str | list[str],
        description: Optional[str] = None,
        label: Optional[str] = None,
    ) -> list[Transaction]:
        """Modify description and/or label for transaction(s) by id(s).
        The label parameter accepts a label *name* which is resolved to its id internally.
        Returns the modified transactions."""
        pass
