"""Migration: replace flat labels with 3-tier hierarchy, remap transactions."""

import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "src"))

from budget.adapters.tsv_label_store import _build_seed_data, FIELDNAMES as LBL_FIELDS
from budget.adapters.tsv_transaction_store import FIELDNAMES as TX_FIELDS
from budget.models.label import Tier

STORAGE = Path(__file__).parent / "storage"
LABELS_PATH = STORAGE / "labels.tsv"
TRANSACTIONS_PATH = STORAGE / "transactions.tsv"

# Mapping from old flat label names to new tier-3 label names
OLD_TO_NEW = {
    "loyer": "Rent",
    "Salaire": "Net salary",
    "food": "Groceries",
    "Vêtements": "Clothes",
    "Restaurant": "Restaurants",
    "Abonnements": "Streaming",
    "Achats plaisir": "Pleasure purchases",
    "Sorites": "Outings",
    "Compléments alimentaires": "Dietary supplements",
    "Remboursements": "Reimbursements",
    "Meubles": "Furniture / Equipment",
    "Investissements": "ETF",
    "Transport / voyages": "Travel",
    "Epargne": "Livret A",
}


def migrate():
    # 1. Read OLD labels to build old_id -> old_name mapping
    old_id_to_name: dict[str, str] = {}
    with open(LABELS_PATH, newline="") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            old_id_to_name[row["id"]] = row["name"]

    print(f"Read {len(old_id_to_name)} old labels.")

    # 2. Build seed data and write new labels.tsv
    seed = _build_seed_data()

    with open(LABELS_PATH, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=LBL_FIELDS, delimiter="\t")
        writer.writeheader()
        for lb in seed:
            writer.writerow({
                "id": lb.id,
                "name": lb.name,
                "tier": lb.tier.value,
                "parent_id": lb.parent_id or "",
                "color": lb.color or "",
            })

    print(f"Wrote {len(seed)} labels ({sum(1 for l in seed if l.tier == Tier.THREE)} tier-3).")

    # 3. Build new tier-3 name -> id lookup
    new_name_to_id = {lb.name: lb.id for lb in seed if lb.tier == Tier.THREE}

    # 4. Build old_id -> new_id mapping: old_id -> old_name -> new_name -> new_id
    old_id_to_new_id: dict[str, str] = {}
    for old_id, old_name in old_id_to_name.items():
        new_name = OLD_TO_NEW.get(old_name)
        if new_name and new_name in new_name_to_id:
            old_id_to_new_id[old_id] = new_name_to_id[new_name]

    # 5. Read transactions and remap label_id
    transactions = []
    with open(TRANSACTIONS_PATH, newline="") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            old_label_id = row.get("label_id", "")
            new_label_id = old_id_to_new_id.get(old_label_id, "")
            transactions.append({
                "id": row["id"],
                "date": row["date"],
                "description": row["description"],
                "amount": row["amount"],
                "label_id": new_label_id,
            })

    with open(TRANSACTIONS_PATH, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=TX_FIELDS, delimiter="\t")
        writer.writeheader()
        writer.writerows(transactions)

    mapped = sum(1 for tx in transactions if tx["label_id"])
    print(f"Migrated {len(transactions)} transactions ({mapped} with labels mapped).")


if __name__ == "__main__":
    migrate()
