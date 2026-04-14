import csv
from datetime import date
from pathlib import Path

from ..models import Transaction
from ..ports import TransactionStore

COL_ID = "id"
COL_DATE = "date"
COL_DESCRIPTION = "description"
COL_AMOUNT = "amount"
COL_LABEL = "label"

FIELDNAMES = [COL_ID, COL_DATE, COL_DESCRIPTION, COL_AMOUNT, COL_LABEL]


class TsvTransactionStore(TransactionStore):
    def __init__(self, path: Path) -> None:
        self._path = path

    def read(self) -> list[Transaction]:
        with open(self._path, newline="") as f:
            reader = csv.DictReader(f, delimiter="\t")
            return [
                Transaction(
                    id=row[COL_ID],
                    date=date.fromisoformat(row[COL_DATE]),
                    description=row[COL_DESCRIPTION],
                    amount=float(row[COL_AMOUNT]),
                    label=row.get(COL_LABEL, ""),
                )
                for row in reader
            ]

    def write(self, transactions: list[Transaction]) -> list[Transaction]:
        existing = self.read()
        existing_ids = {tx.id for tx in existing}
        new = [tx for tx in transactions if tx.id not in existing_ids]

        merged = existing + new

        with open(self._path, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=FIELDNAMES, delimiter="\t")
            writer.writeheader()
            for tx in merged:
                writer.writerow(
                    {
                        COL_ID: tx.id,
                        COL_DATE: tx.date.isoformat(),
                        COL_DESCRIPTION: tx.description,
                        COL_AMOUNT: tx.amount,
                        COL_LABEL: tx.label,
                    }
                )

        return new
