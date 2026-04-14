from datetime import date
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, Query, UploadFile
from pydantic import BaseModel

from ..adapters.csv_transaction_reader import CsvTransactionReader
from ..adapters.tsv_transaction_store import TsvTransactionStore
from ..models import AmountFilter, AmountOp, TransactionFilter
from ..models import ModifyRequest, RemoveRequest

app = FastAPI()

STORAGE_PATH = Path(__file__).resolve().parents[3] / "storage" / "transactions.tsv"
store = TsvTransactionStore(STORAGE_PATH)
reader = CsvTransactionReader()


@app.post("/transactions/upload")
async def upload_transactions(file: UploadFile):
    content = (await file.read()).decode("latin-1")
    transactions = reader.read_transactions(content)
    new = store.write(transactions)
    return [tx.model_dump(mode="json") for tx in new]


@app.get("/transactions")
async def read_transactions(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    description: Optional[str] = Query(None),
    amount_op: Optional[AmountOp] = Query(None),
    amount_value: Optional[float] = Query(None),
):
    transactions = store.read()

    amount = None
    if amount_op is not None and amount_value is not None:
        amount = AmountFilter(op=amount_op, value=amount_value)

    tx_filter = TransactionFilter(
        date_from=date_from,
        date_to=date_to,
        description=description,
        amount=amount,
    )
    filtered = tx_filter.apply(transactions)

    return [tx.model_dump(mode="json") for tx in filtered]


@app.post("/transactions/remove")
async def remove_transactions(body: RemoveRequest):
    removed = store.remove(body.ids)
    return [tx.model_dump(mode="json") for tx in removed]


@app.post("/transactions/modify")
async def modify_transactions(body: ModifyRequest):
    modified = store.modify(body.ids, description=body.description, label=body.label)
    return [tx.model_dump(mode="json") for tx in modified]
