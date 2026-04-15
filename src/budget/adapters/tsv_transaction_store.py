from __future__ import annotations

import csv
from datetime import date
from pathlib import Path
from typing import Optional

from ..models import Transaction
from ..ports import LabelStore, TransactionStore

COL_ID = "id"
COL_DATE = "date"
COL_DESCRIPTION = "description"
COL_AMOUNT = "amount"
COL_LABEL_ID = "label_id"

FIELDNAMES = [COL_ID, COL_DATE, COL_DESCRIPTION, COL_AMOUNT, COL_LABEL_ID]


class TsvTransactionStore(TransactionStore):
    def __init__(self, path: Path, label_store: LabelStore) -> None:
        self._path = path
        self._label_store = label_store

    def read(self) -> list[Transaction]:
        with open(self._path, newline="") as f:
            reader = csv.DictReader(f, delimiter="\t")
            return [
                Transaction(
                    id=row[COL_ID],
                    date=date.fromisoformat(row[COL_DATE]),
                    description=row[COL_DESCRIPTION],
                    amount=float(row[COL_AMOUNT]),
                    label_id=row.get(COL_LABEL_ID, ""),
                )
                for row in reader
            ]

    def write(self, transactions: list[Transaction]) -> list[Transaction]:
        existing = self.read()
        existing_ids = {tx.id for tx in existing}
        new = [tx for tx in transactions if tx.id not in existing_ids]

        merged = existing + new
        self._write_all(merged)

        return new

    def _write_all(self, transactions: list[Transaction]) -> None:
        with open(self._path, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=FIELDNAMES, delimiter="\t")
            writer.writeheader()
            for tx in transactions:
                writer.writerow(
                    {
                        COL_ID: tx.id,
                        COL_DATE: tx.date.isoformat(),
                        COL_DESCRIPTION: tx.description,
                        COL_AMOUNT: tx.amount,
                        COL_LABEL_ID: tx.label_id,
                    }
                )

    def remove(self, ids: str | list[str]) -> list[Transaction]:
        if isinstance(ids, str):
            ids = [ids]
        id_set = set(ids)

        existing = self.read()
        removed = [tx for tx in existing if tx.id in id_set]
        remaining = [tx for tx in existing if tx.id not in id_set]

        self._write_all(remaining)
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

        label_id: str | None = None
        if label is not None:
            found = self._label_store.get_by_name(label)
            if found is None:
                raise ValueError(f"Label '{label}' does not exist. Create it first.")
            label_id = found.id

        existing = self.read()
        modified = []
        for tx in existing:
            if tx.id in id_set:
                if description is not None:
                    tx.description = description
                if label_id is not None:
                    tx.label_id = label_id
                modified.append(tx)

        self._write_all(existing)
        return modified
