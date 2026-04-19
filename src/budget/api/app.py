from datetime import date
from typing import Optional

from fastapi import FastAPI, HTTPException, UploadFile
from pydantic import BaseModel

from ..backend.models import (
    AmountFilter,
    AmountOp,
    Label,
    ModifyRequest,
    RemoveRequest,
    Rule,
    Transaction,
    TransactionFilter,
)
from ..backend.services.rule_engine import RuleEngine
from ..backend.services.transaction_manager import TransactionManager

from pathlib import Path

from ..backend.adapters.csv_transaction_reader import CsvTransactionReader
from ..backend.adapters.tsv_label_store import TsvLabelStore
from ..backend.adapters.tsv_rule_store import TsvRuleStore
from ..backend.adapters.tsv_transaction_store import TsvTransactionStore

app = FastAPI()

# --- Wire concrete implementations at module level ---
STORAGE_DIR = Path(__file__).resolve().parents[3] / "storage"

label_store = TsvLabelStore(STORAGE_DIR / "labels.tsv")
_tx_store = TsvTransactionStore(STORAGE_DIR / "transactions.tsv", label_store)
_rl_store = TsvRuleStore(STORAGE_DIR / "rules.tsv", label_store, _tx_store)
_reader = CsvTransactionReader()

tx_manager = TransactionManager(_reader, _tx_store)
rule_engine = RuleEngine(_rl_store, _tx_store)
tx_manager.rule_engine = rule_engine


# ── Transaction Endpoints ────────────────────────────────────────────


@app.post("/transactions/upload")
async def upload_transactions(file: UploadFile) -> list[Transaction]:
    raw = await file.read()
    for encoding in ("utf-8", "latin-1"):
        try:
            content = raw.decode(encoding)
            break
        except UnicodeDecodeError:
            continue
    else:
        raise HTTPException(400, "Unable to decode file")
    return tx_manager.import_transactions(content)


@app.get("/transactions")
def list_transactions(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    description: Optional[str] = None,
    amount_op: Optional[AmountOp] = None,
    amount_value: Optional[float] = None,
) -> list[Transaction]:
    amount = None
    if amount_op is not None and amount_value is not None:
        amount = AmountFilter(op=amount_op, value=amount_value)
    elif (amount_op is None) != (amount_value is None):
        raise HTTPException(400, "amount_op and amount_value must both be provided or both omitted")

    filters = TransactionFilter(
        date_from=date_from,
        date_to=date_to,
        description=description,
        amount=amount,
    )
    return tx_manager.list(filters)


@app.post("/transactions/modify")
def modify_transactions(body: ModifyRequest) -> list[Transaction]:
    try:
        return tx_manager.modify(body.ids, description=body.description, label=body.label)
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.post("/transactions/remove")
def remove_transactions(body: RemoveRequest) -> list[Transaction]:
    return tx_manager.remove(body.ids)


# ── Label Endpoints ──────────────────────────────────────────────────


@app.get("/labels")
def list_labels(tier: Optional[int] = None) -> list[Label]:
    from ..backend.models.label import Tier

    t = Tier(tier) if tier is not None else None
    return label_store.list(t)


class LabelTreeCategory(BaseModel):
    id: str
    name: str
    color: Optional[str]
    labels: list[dict]


class LabelTreeGroup(BaseModel):
    id: str
    name: str
    categories: list[LabelTreeCategory]


@app.get("/labels/tree")
def label_tree() -> list[LabelTreeGroup]:
    from ..backend.models.label import Tier

    all_labels = label_store.list()
    groups = [lb for lb in all_labels if lb.tier == Tier.ONE]
    categories = [lb for lb in all_labels if lb.tier == Tier.TWO]
    leaves = [lb for lb in all_labels if lb.tier == Tier.THREE]

    tree = []
    for g in groups:
        cats = []
        for c in categories:
            if c.parent_id == g.id:
                cat_labels = [
                    {"id": lb.id, "name": lb.name}
                    for lb in leaves
                    if lb.parent_id == c.id
                ]
                cats.append(LabelTreeCategory(
                    id=c.id, name=c.name, color=c.color, labels=cat_labels,
                ))
        tree.append(LabelTreeGroup(id=g.id, name=g.name, categories=cats))
    return tree


class CreateLabelRequest(BaseModel):
    name: str
    parent_id: str


@app.post("/labels")
def create_label(body: CreateLabelRequest) -> Label:
    try:
        return label_store.create(body.name, body.parent_id)
    except ValueError as e:
        raise HTTPException(400, str(e))


class RenameLabelRequest(BaseModel):
    new_name: Optional[str] = None


@app.post("/labels/{name}/modify")
def modify_label(name: str, body: RenameLabelRequest) -> Label:
    try:
        return label_store.modify(name, new_name=body.new_name)
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.post("/labels/remove")
def remove_labels(body: RemoveRequest) -> list[Label]:
    return label_store.remove(body.ids)


# ── Rule Endpoints ───────────────────────────────────────────────────


@app.get("/rules")
def list_rules() -> list[Rule]:
    return rule_engine.rule_store.list()


class CreateRuleRequest(BaseModel):
    pattern: str
    label_id: str


class CreateRuleResponse(BaseModel):
    rule: Rule
    applied: int


@app.post("/rules")
def create_rule(body: CreateRuleRequest) -> CreateRuleResponse:
    try:
        rule, modified = rule_engine.create_rule(body.pattern, body.label_id)
    except ValueError as e:
        raise HTTPException(400, str(e))
    return CreateRuleResponse(rule=rule, applied=len(modified))


@app.post("/rules/remove")
def remove_rules(body: RemoveRequest) -> list[Rule]:
    return rule_engine.rule_store.remove(body.ids)


class ApplyRulesResponse(BaseModel):
    applied: int
    transactions: list[Transaction]


@app.post("/rules/apply")
def apply_rules() -> ApplyRulesResponse:
    modified = rule_engine.reapply_all()
    return ApplyRulesResponse(applied=len(modified), transactions=modified)
