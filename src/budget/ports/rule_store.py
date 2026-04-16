from __future__ import annotations

from abc import ABC, abstractmethod

from ..models.rule import Rule
from ..models.transaction import Transaction


class RuleStore(ABC):
    @abstractmethod
    def list(self) -> list[Rule]:
        pass

    @abstractmethod
    def create(self, pattern: str, label_id: str) -> Rule:
        """Create a new rule. Raises ValueError if the label_id doesn't exist."""
        pass

    @abstractmethod
    def remove(self, ids: str | list[str]) -> list[Rule]:
        """Remove rule(s) by id. Returns the removed rules."""
        pass

    @abstractmethod
    def apply(self, transactions: list[Transaction]) -> list[Transaction]:
        """Apply all rules to the given transactions.
        Only unlabeled transactions are affected.
        Returns the list of transactions that were modified."""
        pass
