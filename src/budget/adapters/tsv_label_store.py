from __future__ import annotations

import csv
from pathlib import Path

from ..models.label import Label, Tier, _generate_id
from ..ports import LabelStore

COL_ID = "id"
COL_NAME = "name"
COL_TIER = "tier"
COL_PARENT_ID = "parent_id"
COL_COLOR = "color"
COL_MANDATORY = "mandatory"

FIELDNAMES = [COL_ID, COL_NAME, COL_TIER, COL_PARENT_ID, COL_COLOR, COL_MANDATORY]


def _build_seed_data() -> list[Label]:
    """Build the default 3-tier label hierarchy."""
    labels: list[Label] = []

    def t1(name: str) -> str:
        lb = Label(id=_generate_id(), name=name, tier=Tier.ONE)
        labels.append(lb)
        return lb.id

    def t2(name: str, parent: str, color: str) -> str:
        lb = Label(id=_generate_id(), name=name, tier=Tier.TWO, parent_id=parent, color=color)
        labels.append(lb)
        return lb.id

    def t3(name: str, parent: str) -> None:
        labels.append(Label(id=_generate_id(), name=name, tier=Tier.THREE, parent_id=parent))

    # --- Tier 1: Expense ---
    expense = t1("Expense")

    food = t2("Food", expense, "#e67e22")
    t3("Groceries", food)
    t3("Restaurants", food)
    t3("Snacks / Takeout", food)
    t3("Dietary supplements", food)

    housing = t2("Housing", expense, "#3498db")
    t3("Rent", housing)
    t3("Utilities", housing)
    t3("Home insurance", housing)
    t3("Furniture / Equipment", housing)

    transport = t2("Transport", expense, "#AD97D3")
    t3("Public transport", transport)
    t3("Taxi / Rideshare", transport)
    t3("Fuel", transport)
    t3("Travel", transport)

    shopping = t2("Shopping", expense, "#8b4513")
    t3("Electronics", shopping)
    t3("Pleasure purchases", shopping)
    t3("Gifts", shopping)

    subscriptions = t2("Subscriptions & Telecom", expense, "#95a5a6")
    t3("Phone", subscriptions)
    t3("Internet", subscriptions)
    t3("Streaming", subscriptions)
    t3("Software", subscriptions)
    t3("Gym", subscriptions)

    going_out = t2("Going out & Leisure", expense, "#e74c3c")
    t3("Outings", going_out)
    t3("Parties", going_out)
    t3("Sports", going_out)
    t3("Culture", going_out)

    health = t2("Health", expense, "#1abc9c")
    t3("Doctor / Pharmacy", health)
    t3("Health insurance", health)

    personal_care = t2("Personal care", expense, "#e91e8a")
    t3("Haircut", personal_care)
    t3("Clothes", personal_care)
    t3("Shoes", personal_care)
    t3("Cosmetics", personal_care)

    # --- Tier 1: Earnings ---
    earnings = t1("Earnings")

    salary = t2("Salary", earnings, "#2ecc71")
    t3("Net salary", salary)
    t3("Bonuses", salary)

    other_income = t2("Other income", earnings, "#f1c40f")
    t3("Reimbursements", other_income)
    t3("Benefits", other_income)
    t3("Side income", other_income)

    # --- Tier 1: Investment ---
    investment_t1 = t1("Investment")

    savings = t2("Savings", investment_t1, "#08C952")
    t3("Livret A", savings)

    investment = t2("Investment", investment_t1, "#ff7f50")
    t3("Skills", investment)
    t3("ETF", investment)
    t3("Real estate", investment)
    t3("Work tools / equipment", investment)

    return labels


class TsvLabelStore(LabelStore):
    def __init__(self, path: Path) -> None:
        self._path = path
        self._path.parent.mkdir(parents=True, exist_ok=True)
        if not self._path.exists():
            self._write_all(_build_seed_data())

    def list(self, tier: Tier | None = None) -> list[Label]:
        all_labels = self._read_all()
        if tier is not None:
            return [lb for lb in all_labels if lb.tier == tier]
        return all_labels

    def get(self, label_id: str) -> Label | None:
        for lb in self._read_all():
            if lb.id == label_id:
                return lb
        return None

    def get_by_name(self, name: str) -> Label | None:
        for lb in self._read_all():
            if lb.tier == Tier.THREE and lb.name == name:
                return lb
        return None

    def create(self, name: str, parent_id: str) -> Label:
        existing = self._read_all()

        parent = None
        for lb in existing:
            if lb.id == parent_id:
                parent = lb
                break
        if parent is None or parent.tier != Tier.TWO:
            raise ValueError(f"Parent '{parent_id}' is not a valid tier-2 label.")

        if any(lb.name == name and lb.tier == Tier.THREE for lb in existing):
            raise ValueError(f"Tier-3 label '{name}' already exists.")

        label = Label(id=_generate_id(), name=name, tier=Tier.THREE, parent_id=parent_id)
        existing.append(label)
        self._write_all(existing)
        return label

    def remove(self, names: str | list[str]) -> list[Label]:
        if isinstance(names, str):
            names = [names]
        name_set = set(names)

        existing = self._read_all()
        removed = [lb for lb in existing if lb.tier == Tier.THREE and lb.name in name_set]
        remaining = [lb for lb in existing if not (lb.tier == Tier.THREE and lb.name in name_set)]

        self._write_all(remaining)
        return removed

    def modify(self, name: str, new_name: str | None = None) -> Label:
        existing = self._read_all()
        target = None
        for lb in existing:
            if lb.tier == Tier.THREE and lb.name == name:
                target = lb
                break

        if target is None:
            raise ValueError(f"Tier-3 label '{name}' not found.")

        if new_name is not None:
            if any(lb.name == new_name and lb.tier == Tier.THREE for lb in existing if lb is not target):
                raise ValueError(f"Tier-3 label '{new_name}' already exists.")
            target.name = new_name

        self._write_all(existing)
        return target

    def get_color(self, label_id: str) -> str | None:
        all_labels = self._read_all()
        by_id = {lb.id: lb for lb in all_labels}

        label = by_id.get(label_id)
        if label is None:
            return None
        if label.tier == Tier.TWO:
            return label.color
        if label.tier == Tier.THREE and label.parent_id:
            parent = by_id.get(label.parent_id)
            return parent.color if parent else None
        return None

    # --- internal ---

    def _read_all(self) -> list[Label]:
        with open(self._path, newline="") as f:
            reader = csv.DictReader(f, delimiter="\t")
            return [
                Label(
                    id=row[COL_ID],
                    name=row[COL_NAME],
                    tier=int(row[COL_TIER]),
                    parent_id=row[COL_PARENT_ID] or None,
                    color=row[COL_COLOR] or None,
                    mandatory=(row.get(COL_MANDATORY) or "").lower() == "true",
                )
                for row in reader
            ]

    def _write_all(self, labels: list[Label]) -> None:
        with open(self._path, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=FIELDNAMES, delimiter="\t")
            writer.writeheader()
            for lb in labels:
                writer.writerow({
                    COL_ID: lb.id,
                    COL_NAME: lb.name,
                    COL_TIER: lb.tier.value,
                    COL_PARENT_ID: lb.parent_id or "",
                    COL_COLOR: lb.color or "",
                    COL_MANDATORY: "true" if lb.mandatory else "",
                })
