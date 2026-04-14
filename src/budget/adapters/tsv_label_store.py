from __future__ import annotations

import csv
from pathlib import Path
from typing import Optional

from ..models import Label
from ..ports import LabelStore

COL_NAME = "name"
COL_COLOR = "color"

FIELDNAMES = [COL_NAME, COL_COLOR]


class TsvLabelStore(LabelStore):
    def __init__(self, path: Path) -> None:
        self._path = path
        self._path.parent.mkdir(parents=True, exist_ok=True)
        if not self._path.exists():
            self._write_all([])

    def list(self) -> list[Label]:
        with open(self._path, newline="") as f:
            reader = csv.DictReader(f, delimiter="\t")
            return [
                Label(name=row[COL_NAME], color=row[COL_COLOR])
                for row in reader
            ]

    def create(self, name: str, color: str) -> Label:
        existing = self.list()
        if any(lb.name == name for lb in existing):
            raise ValueError(f"Label '{name}' already exists")

        label = Label(name=name, color=color)
        existing.append(label)
        self._write_all(existing)
        return label

    def remove(self, names: str | list[str]) -> list[Label]:
        if isinstance(names, str):
            names = [names]
        name_set = set(names)

        existing = self.list()
        removed = [lb for lb in existing if lb.name in name_set]
        remaining = [lb for lb in existing if lb.name not in name_set]

        self._write_all(remaining)
        return removed

    def modify(self, name: str, new_name: Optional[str] = None, color: Optional[str] = None) -> Label:
        existing = self.list()
        target = None
        for lb in existing:
            if lb.name == name:
                target = lb
                break

        if target is None:
            raise ValueError(f"Label '{name}' not found")

        if new_name is not None:
            if any(lb.name == new_name for lb in existing if lb is not target):
                raise ValueError(f"Label '{new_name}' already exists")
            target.name = new_name
        if color is not None:
            target.color = color

        self._write_all(existing)
        return target

    def _write_all(self, labels: list[Label]) -> None:
        with open(self._path, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=FIELDNAMES, delimiter="\t")
            writer.writeheader()
            for lb in labels:
                writer.writerow({COL_NAME: lb.name, COL_COLOR: lb.color})
