from __future__ import annotations

import csv
import io
import re
import uuid
from pathlib import Path

from ..models.label import Tier
from ..models.rule import Rule
from ..models.transaction import Transaction
from ..ports.label_store import LabelStore
from ..ports.rule_store import RuleStore
from ..ports.transaction_store import TransactionStore

COLUMNS = ["id", "pattern", "label_id"]


def _gen_id() -> str:
    return uuid.uuid4().hex[:8]


class TsvRuleStore(RuleStore):
    """Persist rules as a TSV file."""

    def __init__(
        self,
        path: Path,
        label_store: LabelStore,
        tx_store: TransactionStore,
    ) -> None:
        self.path = path
        self.label_store = label_store
        self.tx_store = tx_store
        if not self.path.exists():
            self._write_all([])

    # ── private helpers ──────────────────────────────────────────────

    def _read_all(self) -> list[Rule]:
        text = self.path.read_text(encoding="utf-8")
        if not text.strip():
            return []
        reader = csv.DictReader(io.StringIO(text), delimiter="\t")
        return [
            Rule(id=row["id"], pattern=row["pattern"], label_id=row["label_id"])
            for row in reader
        ]

    def _write_all(self, rules: list[Rule]) -> None:
        buf = io.StringIO()
        writer = csv.DictWriter(buf, fieldnames=COLUMNS, delimiter="\t")
        writer.writeheader()
        for rule in rules:
            writer.writerow({"id": rule.id, "pattern": rule.pattern, "label_id": rule.label_id})
        self.path.write_text(buf.getvalue(), encoding="utf-8")

    # ── port implementation ──────────────────────────────────────────

    def list(self) -> list[Rule]:
        return self._read_all()

    def create(self, pattern: str, label_id: str) -> Rule:
        try:
            re.compile(pattern)
        except re.error as e:
            raise ValueError(f"Invalid regex: {e}")

        lb = self.label_store.get(label_id)
        if lb is None or lb.tier != Tier.THREE:
            raise ValueError(f"label_id '{label_id}' is not a valid tier-3 label")

        rule = Rule(id=_gen_id(), pattern=pattern, label_id=label_id)
        rules = self._read_all()
        rules.append(rule)
        self._write_all(rules)
        return rule

    def remove(self, ids: str | list[str]) -> list[Rule]:
        if isinstance(ids, str):
            ids = [ids]
        id_set = set(ids)
        rules = self._read_all()
        removed = [r for r in rules if r.id in id_set]
        kept = [r for r in rules if r.id not in id_set]
        self._write_all(kept)
        return removed

    def apply(self, transactions: list[Transaction]) -> list[Transaction]:
        rules = self._read_all()
        if not rules:
            return []

        compiled = [(rule, re.compile(rule.pattern)) for rule in rules]
        modified: list[Transaction] = []

        for tx in transactions:
            if tx.label_id:
                continue
            for rule, pattern in compiled:
                if pattern.search(tx.description):
                    tx.label_id = rule.label_id
                    modified.append(tx)
                    break

        if modified:
            # Persist changes: read full store, update matched, write back
            all_tx = self.tx_store.read()
            modified_ids = {tx.id: tx.label_id for tx in modified}
            for tx in all_tx:
                if tx.id in modified_ids:
                    tx.label_id = modified_ids[tx.id]
            self.tx_store._write_all(all_tx)  # type: ignore[attr-defined]

        return modified
