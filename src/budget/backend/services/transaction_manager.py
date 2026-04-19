from __future__ import annotations

from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from .rule_engine import RuleEngine

from ..models.transaction import Transaction
from ..models.transaction_filter import TransactionFilter
from ..ports.transaction_reader import TransactionReader
from ..ports.transaction_store import TransactionStore


class TransactionManager:
    def __init__(
        self,
        reader: TransactionReader,
        store: TransactionStore,
    ) -> None:
        self.reader = reader
        self.store = store
        self.rule_engine: Optional[RuleEngine] = None  # set after RuleEngine is created to avoid circular init

    def import_transactions(self, content: str) -> list[Transaction]:
        """Decode content, parse via reader, write via store (dedup),
        then apply rules on new records."""
        parsed = self.reader.read_transactions(content)
        new = self.store.write(parsed)
        if self.rule_engine and new:
            self.rule_engine.on_import(new)
        return new

    def list(self, filters: Optional[TransactionFilter] = None) -> list[Transaction]:
        """Read all from store, apply filter in memory."""
        transactions = self.store.read()
        if filters:
            transactions = filters.apply(transactions)
        return transactions

    def modify(
        self,
        ids: str | list[str],
        description: Optional[str] = None,
        label: Optional[str] = None,
    ) -> list[Transaction]:
        return self.store.modify(ids, description=description, label=label)

    def remove(self, ids: str | list[str]) -> list[Transaction]:
        return self.store.remove(ids)
