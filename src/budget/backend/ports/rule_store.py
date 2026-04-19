from __future__ import annotations

from abc import ABC, abstractmethod

from ..models.rule import Rule
from ..models.transaction import Transaction


class RuleStore(ABC):
    @abstractmethod
    def list(self) -> list[Rule]:
        """Return all rules."""

    @abstractmethod
    def create(self, pattern: str, label_id: str) -> Rule:
        """Create a rule. Validate regex compiles and label_id is tier-3.
        Raise ValueError otherwise."""

    @abstractmethod
    def remove(self, ids: str | list[str]) -> list[Rule]:
        """Delete by id. Return removed records."""

    @abstractmethod
    def apply(self, transactions: list[Transaction]) -> list[Transaction]:
        """Apply all rules to given transactions. Only unlabelled affected.
        First match wins. Persist label changes. Return modified transactions."""
