from __future__ import annotations

import csv
import hashlib
import io
from datetime import datetime

from ..models.transaction import Transaction
from ..ports.transaction_reader import TransactionReader

# Columns in the bank CSV (after skipping 6 header lines)
COL_DATE = "Date"
COL_DESCRIPTION = "Libellé"
COL_AMOUNT = "Montant(EUROS)"


class CsvTransactionReader(TransactionReader):
    """Parse a bank CSV export into Transaction objects.

    Expected format: 6 header lines to skip, then a semicolon-delimited CSV
    with columns Date, Libellé, Montant(EUROS).
    """

    def read_transactions(self, content: str) -> list[Transaction]:
        lines = content.splitlines(keepends=True)
        body = "".join(lines[6:])

        reader = csv.DictReader(io.StringIO(body), delimiter=";")
        transactions: list[Transaction] = []

        for row in reader:
            date = datetime.strptime(row[COL_DATE].strip(), "%d/%m/%Y").date()
            description = row[COL_DESCRIPTION].strip()
            amount_raw = row[COL_AMOUNT].strip().replace(",", ".")
            amount = float(amount_raw)

            # Deterministic id from date+description+amount to enable dedup
            raw = f"{date.isoformat()}|{description}|{amount}"
            tx_id = hashlib.sha256(raw.encode()).hexdigest()[:12]

            transactions.append(Transaction(
                id=tx_id,
                date=date,
                description=description,
                amount=amount,
            ))

        return transactions
