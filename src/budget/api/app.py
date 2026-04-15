from datetime import date
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, Query, UploadFile
from pydantic import BaseModel

from fastapi import HTTPException

from ..adapters.csv_transaction_reader import CsvTransactionReader
from ..adapters.tsv_label_store import TsvLabelStore
from ..adapters.tsv_transaction_store import TsvTransactionStore
from ..models import AmountFilter, AmountOp, TransactionFilter
from ..models import ModifyRequest, RemoveRequest
from ..models.label import Tier

app = FastAPI()

STORAGE_DIR = Path(__file__).resolve().parents[3] / "storage"
label_store = TsvLabelStore(STORAGE_DIR / "labels.tsv")
store = TsvTransactionStore(STORAGE_DIR / "transactions.tsv", label_store)
reader = CsvTransactionReader()


@app.post("/transactions/upload")
async def upload_transactions(file: UploadFile):
    raw = await file.read()
    try:
        content = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        content = raw.decode("latin-1")
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
    try:
        modified = store.modify(body.ids, description=body.description, label=body.label)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return [tx.model_dump(mode="json") for tx in modified]


# --- Label endpoints ---


class CreateLabelRequest(BaseModel):
    name: str
    parent_id: str  # must be a tier-2 label id


class ModifyLabelRequest(BaseModel):
    new_name: Optional[str] = None


@app.get("/labels")
async def list_labels(tier: Optional[int] = Query(None)):
    """List labels, optionally filtered by tier (1, 2, or 3)."""
    t = Tier(tier) if tier is not None else None
    return [lb.model_dump() for lb in label_store.list(tier=t)]


@app.get("/labels/tree")
async def label_tree():
    """Return the full label hierarchy as a nested tree."""
    all_labels = label_store.list()
    by_id = {lb.id: lb for lb in all_labels}

    tree = []
    for t1 in (lb for lb in all_labels if lb.tier == Tier.ONE):
        t1_node = {"id": t1.id, "name": t1.name, "categories": []}
        for t2 in (lb for lb in all_labels if lb.tier == Tier.TWO and lb.parent_id == t1.id):
            t2_node = {
                "id": t2.id,
                "name": t2.name,
                "color": t2.color,
                "labels": [
                    {"id": t3.id, "name": t3.name}
                    for t3 in all_labels
                    if t3.tier == Tier.THREE and t3.parent_id == t2.id
                ],
            }
            t1_node["categories"].append(t2_node)
        tree.append(t1_node)
    return tree


@app.post("/labels")
async def create_label(body: CreateLabelRequest):
    try:
        label = label_store.create(body.name, body.parent_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return label.model_dump()


@app.post("/labels/{name}/modify")
async def modify_label(name: str, body: ModifyLabelRequest):
    try:
        label = label_store.modify(name, new_name=body.new_name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return label.model_dump()


@app.post("/labels/remove")
async def remove_labels(body: RemoveRequest):
    removed = label_store.remove(body.ids)
    return [lb.model_dump() for lb in removed]
