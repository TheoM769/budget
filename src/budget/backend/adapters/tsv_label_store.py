from __future__ import annotations

import csv
import io
import uuid
from pathlib import Path
from typing import Optional

from ..models.label import Label, Tier
from ..ports.label_store import LabelStore

COLUMNS = ["id", "name", "tier", "parent_id", "color"]


def _gen_id() -> str:
    return uuid.uuid4().hex[:8]


def _build_seed_data() -> list[Label]:
    """Default 3-tier label hierarchy."""
    labels: list[Label] = []

    hierarchy: dict[str, dict[str, list[str]]] = {
        "Vie courante": {
            "Alimentation|#4CAF50": ["Courses", "Restaurant", "Livraison"],
            "Logement|#2196F3": ["Loyer", "Énergie", "Assurance habitation"],
            "Transport|#FF9800": ["Carburant", "Transport en commun", "Entretien véhicule"],
            "Santé|#E91E63": ["Médecin", "Pharmacie", "Mutuelle"],
        },
        "Loisirs": {
            "Sorties|#9C27B0": ["Cinéma", "Concerts", "Bars"],
            "Abonnements|#00BCD4": ["Streaming", "Sport", "Presse"],
            "Vacances|#FF5722": ["Hébergement", "Activités", "Souvenirs"],
        },
        "Revenus": {
            "Salaire|#8BC34A": ["Salaire net", "Prime"],
            "Autres revenus|#CDDC39": ["Remboursement", "Vente"],
        },
    }

    for group_name, categories in hierarchy.items():
        gid = _gen_id()
        labels.append(Label(id=gid, name=group_name, tier=Tier.ONE))
        for cat_spec, leaf_names in categories.items():
            cat_name, color = cat_spec.split("|")
            cid = _gen_id()
            labels.append(Label(id=cid, name=cat_name, tier=Tier.TWO, parent_id=gid, color=color))
            for leaf in leaf_names:
                labels.append(Label(id=_gen_id(), name=leaf, tier=Tier.THREE, parent_id=cid))

    return labels


class TsvLabelStore(LabelStore):
    """Persist labels as a TSV file with seed data on first init."""

    def __init__(self, path: Path) -> None:
        self.path = path
        if not self.path.exists():
            self._write_all(_build_seed_data())

    # ── private helpers ──────────────────────────────────────────────

    def _read_all(self) -> list[Label]:
        text = self.path.read_text(encoding="utf-8")
        if not text.strip():
            return []
        reader = csv.DictReader(io.StringIO(text), delimiter="\t")
        return [
            Label(
                id=row["id"],
                name=row["name"],
                tier=int(row["tier"]),
                parent_id=row.get("parent_id") or None,
                color=row.get("color") or None,
            )
            for row in reader
        ]

    def _write_all(self, labels: list[Label]) -> None:
        buf = io.StringIO()
        writer = csv.DictWriter(buf, fieldnames=COLUMNS, delimiter="\t")
        writer.writeheader()
        for lb in labels:
            writer.writerow({
                "id": lb.id,
                "name": lb.name,
                "tier": lb.tier.value,
                "parent_id": lb.parent_id or "",
                "color": lb.color or "",
            })
        self.path.write_text(buf.getvalue(), encoding="utf-8")

    # ── port implementation ──────────────────────────────────────────

    def list(self, tier: Optional[Tier] = None) -> list[Label]:
        labels = self._read_all()
        if tier is not None:
            labels = [lb for lb in labels if lb.tier == tier]
        return labels

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

    def get_color(self, label_id: str) -> str | None:
        labels = self._read_all()
        by_id = {lb.id: lb for lb in labels}
        lb = by_id.get(label_id)
        if lb is None:
            return None
        if lb.tier == Tier.TWO:
            return lb.color
        if lb.tier == Tier.THREE and lb.parent_id:
            parent = by_id.get(lb.parent_id)
            return parent.color if parent else None
        return None

    def create(self, name: str, parent_id: str) -> Label:
        labels = self._read_all()
        parent = next((lb for lb in labels if lb.id == parent_id), None)
        if parent is None or parent.tier != Tier.TWO:
            raise ValueError(f"Parent '{parent_id}' not found or not tier-2")
        if any(lb.name == name for lb in labels):
            raise ValueError(f"Label name '{name}' already exists")
        new = Label(id=_gen_id(), name=name, tier=Tier.THREE, parent_id=parent_id)
        labels.append(new)
        self._write_all(labels)
        return new

    def modify(self, name: str, new_name: Optional[str] = None) -> Label:
        labels = self._read_all()
        target = next((lb for lb in labels if lb.tier == Tier.THREE and lb.name == name), None)
        if target is None:
            raise ValueError(f"Tier-3 label '{name}' not found")
        if new_name is not None:
            if any(lb.name == new_name for lb in labels):
                raise ValueError(f"Label name '{new_name}' already taken")
            target.name = new_name
        self._write_all(labels)
        return target

    def remove(self, names: str | list[str]) -> list[Label]:
        if isinstance(names, str):
            names = [names]
        name_set = set(names)
        labels = self._read_all()
        removed = [lb for lb in labels if lb.tier == Tier.THREE and lb.name in name_set]
        kept = [lb for lb in labels if not (lb.tier == Tier.THREE and lb.name in name_set)]
        self._write_all(kept)
        return removed
