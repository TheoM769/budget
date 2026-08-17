from __future__ import annotations

import csv
import re
from pathlib import Path

from ..models.rule import Rule, _generate_id
from ..models.transaction import Transaction
from ..ports import LabelStore, TransactionStore
from ..ports.rule_store import RuleStore

COL_ID = "id"
COL_PATTERN = "pattern"
COL_LABEL_ID = "label_id"

FIELDNAMES = [COL_ID, COL_PATTERN, COL_LABEL_ID]


class TsvRuleStore(RuleStore):
    def __init__(
        self,
        path: Path,
        label_store: LabelStore,
        transaction_store: TransactionStore,
    ) -> None:
        self._path = path
        self._label_store = label_store
        self._transaction_store = transaction_store
        self._path.parent.mkdir(parents=True, exist_ok=True)
        if not self._path.exists():
            self._write_all([])

    def list(self) -> list[Rule]:
        return self._read_all()

    def create(self, pattern: str, label_id: str) -> Rule:
        label = self._label_store.get(label_id)
        if label is None:
            raise ValueError(f"Label id '{label_id}' does not exist.")

        # Validate regex
        try:
            re.compile(pattern)
        except re.error as e:
            raise ValueError(f"Invalid regex pattern: {e}")

        rule = Rule(id=_generate_id(), pattern=pattern, label_id=label_id)
        existing = self._read_all()
        existing.append(rule)
        self._write_all(existing)
        return rule

    def remove(self, ids: str | list[str]) -> list[Rule]:
        if isinstance(ids, str):
            ids = [ids]
        id_set = set(ids)

        existing = self._read_all()
        removed = [r for r in existing if r.id in id_set]
        remaining = [r for r in existing if r.id not in id_set]
        self._write_all(remaining)
        return removed

    def apply(self, transactions: list[Transaction]) -> list[Transaction]:
        rules = self._read_all()
        if not rules:
            return []

        modified: list[Transaction] = []
        for tx in transactions:
            if tx.label_id:
                continue
            for rule in rules:
                if re.search(rule.pattern, tx.description, re.IGNORECASE):
                    tx.label_id = rule.label_id
                    modified.append(tx)
                    break  # first matching rule wins

        if modified:
            all_txs = self._transaction_store.read()
            modified_ids = {tx.id for tx in modified}
            for stored_tx in all_txs:
                if stored_tx.id in modified_ids:
                    match = next(m for m in modified if m.id == stored_tx.id)
                    stored_tx.label_id = match.label_id
            self._transaction_store._write_all(all_txs)

        return modified

    # --- internal ---

    def _read_all(self) -> list[Rule]:
        with open(self._path, newline="") as f:
            reader = csv.DictReader(f, delimiter="\t")
            return [
                Rule(
                    id=row[COL_ID],
                    pattern=row[COL_PATTERN],
                    label_id=row[COL_LABEL_ID],
                )
                for row in reader
            ]

    def _write_all(self, rules: list[Rule]) -> None:
        with open(self._path, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=FIELDNAMES, delimiter="\t")
            writer.writeheader()
            for rule in rules:
                writer.writerow(
                    {
                        COL_ID: rule.id,
                        COL_PATTERN: rule.pattern,
                        COL_LABEL_ID: rule.label_id,
                    }
                )
