import csv
import hashlib
from datetime import date, datetime

from ..models import Transaction
from ..ports import TransactionReader

COL_DATE = "Date"
COL_DESCRIPTION = "Libellé"
COL_AMOUNT = "Montant(EUROS)"

FORMATS = [
    "%Y-%m-%d",  # 2024-01-15
    "%d/%m/%Y",  # 15/01/2024
    "%m/%d/%Y",  # 01/15/2024
    "%d-%m-%Y",  # 15-01-2024
    "%d %B %Y",  # 15 January 2024
    "%B %d, %Y",  # January 15, 2024
    "%d/%m/%y",  # 15/01/24
]


def parse_date(value: str) -> date:
    value = value.strip()
    for fmt in FORMATS:
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    raise ValueError(f"Cannot parse date: '{value}'")


class CsvTransactionReader(TransactionReader):
    SKIP_LINES = 6

    def read_transactions(self, file_content: str) -> list[Transaction]:
        lines = file_content.splitlines(keepends=True)
        reader = csv.DictReader(lines[self.SKIP_LINES :], delimiter=";")

        transactions: list[Transaction] = []
        for row in reader:
            raw_date = row[COL_DATE].strip()
            description = row[COL_DESCRIPTION].strip()
            amount = float(row[COL_AMOUNT].strip().replace(",", "."))

            hash_input = f"{raw_date}{description}{amount}"
            tx_id = hashlib.sha256(hash_input.encode()).hexdigest()

            transactions.append(
                Transaction(
                    id=tx_id,
                    date=parse_date(raw_date),
                    description=description,
                    amount=amount,
                )
            )

        return transactions
