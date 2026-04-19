from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Optional

from ..models.transaction import Transaction


class TransactionStore(ABC):
    @abstractmethod
    def read(self) -> list[Transaction]:
        """Return all persisted transactions."""

    @abstractmethod
    def write(self, transactions: list[Transaction]) -> list[Transaction]:
        """Persist transactions. Skip duplicates. Return newly written records."""

    @abstractmethod
    def remove(self, ids: str | list[str]) -> list[Transaction]:
        """Delete by id. Return removed records."""

    @abstractmethod
    def modify(
        self,
        ids: str | list[str],
        description: Optional[str] = None,
        label: Optional[str] = None,
    ) -> list[Transaction]:
        """Update description and/or label on matching transactions.
        label is a label name resolved to id internally.
        Raise ValueError if label name does not exist.
        Return modified records."""
