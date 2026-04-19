from ..models.rule import Rule
from ..models.transaction import Transaction
from ..ports.rule_store import RuleStore
from ..ports.transaction_store import TransactionStore


class RuleEngine:
    def __init__(self, rule_store: RuleStore, tx_store: TransactionStore) -> None:
        self.rule_store = rule_store
        self.tx_store = tx_store

    def create_rule(self, pattern: str, label_id: str) -> tuple[Rule, list[Transaction]]:
        """Create rule, then apply it to all existing transactions.
        Returns (rule, list of modified transactions)."""
        rule = self.rule_store.create(pattern, label_id)
        all_tx = self.tx_store.read()
        modified = self.rule_store.apply(all_tx)
        return rule, modified

    def on_import(self, transactions: list[Transaction]) -> list[Transaction]:
        """Apply all rules to newly imported transactions."""
        return self.rule_store.apply(transactions)

    def reapply_all(self) -> list[Transaction]:
        """Apply all rules to all transactions."""
        all_tx = self.tx_store.read()
        return self.rule_store.apply(all_tx)
