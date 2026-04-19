from __future__ import annotations

import csv
import io
from pathlib import Path
from typing import Optional

from ..models.transaction import Transaction
from ..ports.label_store import LabelStore
from ..ports.transaction_store import TransactionStore

COLUMNS = ["id", "date", "description", "amount", "label_id"]


class TsvTransactionStore(TransactionStore):
    """Persist transactions as a TSV file."""

    def __init__(self, path: Path, label_store: LabelStore) -> None:
        self.path = path
        self.label_store = label_store
        if not self.path.exists():
            self._write_all([])

    # ── private helpers ──────────────────────────────────────────────

    def _read_all(self) -> list[Transaction]:
        text = self.path.read_text(encoding="utf-8")
        if not text.strip():
            return []
        reader = csv.DictReader(io.StringIO(text), delimiter="\t")
        return [
            Transaction(
                id=row["id"],
                date=row["date"],
                description=row["description"],
                amount=float(row["amount"]),
                label_id=row.get("label_id", ""),
            )
            for row in reader
        ]

    def _write_all(self, transactions: list[Transaction]) -> None:
        buf = io.StringIO()
        writer = csv.DictWriter(buf, fieldnames=COLUMNS, delimiter="\t")
        writer.writeheader()
        for tx in transactions:
            writer.writerow({
                "id": tx.id,
                "date": tx.date.isoformat(),
                "description": tx.description,
                "amount": tx.amount,
                "label_id": tx.label_id,
            })
        self.path.write_text(buf.getvalue(), encoding="utf-8")

    # ── port implementation ──────────────────────────────────────────

    def read(self) -> list[Transaction]:
        return self._read_all()

    def write(self, transactions: list[Transaction]) -> list[Transaction]:
        existing = self._read_all()
        existing_ids = {tx.id for tx in existing}
        new = [tx for tx in transactions if tx.id not in existing_ids]
        if new:
            self._write_all(existing + new)
        return new

    def remove(self, ids: str | list[str]) -> list[Transaction]:
        if isinstance(ids, str):
            ids = [ids]
        id_set = set(ids)
        existing = self._read_all()
        removed = [tx for tx in existing if tx.id in id_set]
        kept = [tx for tx in existing if tx.id not in id_set]
        self._write_all(kept)
        return removed

    def modify(
        self,
        ids: str | list[str],
        description: Optional[str] = None,
        label: Optional[str] = None,
    ) -> list[Transaction]:
        if isinstance(ids, str):
            ids = [ids]
        id_set = set(ids)

        # Resolve label name → id
        label_id: str | None = None
        if label is not None:
            lb = self.label_store.get_by_name(label)
            if lb is None:
                raise ValueError(f"Label '{label}' not found")
            label_id = lb.id

        existing = self._read_all()
        modified: list[Transaction] = []
        for tx in existing:
            if tx.id in id_set:
                if description is not None:
                    tx.description = description
                if label_id is not None:
                    tx.label_id = label_id
                modified.append(tx)
        self._write_all(existing)
        return modified
