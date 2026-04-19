from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Optional

from ..models.label import Label, Tier


class LabelStore(ABC):
    @abstractmethod
    def list(self, tier: Optional[Tier] = None) -> list[Label]:
        """Return all labels, optionally filtered by tier."""

    @abstractmethod
    def get(self, label_id: str) -> Label | None:
        """Return label by id."""

    @abstractmethod
    def get_by_name(self, name: str) -> Label | None:
        """Return tier-3 label by name. None if not found."""

    @abstractmethod
    def get_color(self, label_id: str) -> str | None:
        """Return color for a label. Tier-3 inherits from tier-2 parent."""

    @abstractmethod
    def create(self, name: str, parent_id: str) -> Label:
        """Create tier-3 label under tier-2 parent.
        Raise ValueError if parent not tier-2 or name already exists."""

    @abstractmethod
    def modify(self, name: str, new_name: Optional[str] = None) -> Label:
        """Rename tier-3 label by current name.
        Raise ValueError if not found or new name already taken."""

    @abstractmethod
    def remove(self, names: str | list[str]) -> list[Label]:
        """Delete tier-3 labels by name. Return removed records."""
