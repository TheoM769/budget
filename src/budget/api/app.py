from pathlib import Path

from fastapi import FastAPI, UploadFile

from ..adapters.csv_transaction_reader import CsvTransactionReader
from ..adapters.tsv_transaction_store import TsvTransactionStore

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
async def read_transactions():
    transactions = store.read()
    return [tx.model_dump(mode="json") for tx in transactions]
