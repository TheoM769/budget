from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Optional

from ..models.label import Label, Tier


class LabelStore(ABC):
    @abstractmethod
    def list(self, tier: Optional[Tier] = None) -> list[Label]:
        """List labels, optionally filtered by tier."""
        pass

    @abstractmethod
    def get(self, label_id: str) -> Label | None:
        """Return a label by id, or None."""
        pass

    @abstractmethod
    def get_by_name(self, name: str) -> Label | None:
        """Return the tier-3 label with the given name, or None."""
        pass

    @abstractmethod
    def create(self, name: str, parent_id: str) -> Label:
        """Create a new tier-3 label under a tier-2 parent.
        Raises ValueError if name already exists or parent is not tier 2."""
        pass

    @abstractmethod
    def remove(self, names: str | list[str]) -> list[Label]:
        """Remove tier-3 label(s) by name. Returns the removed labels."""
        pass

    @abstractmethod
    def modify(self, name: str, new_name: Optional[str] = None) -> Label:
        """Rename a tier-3 label. Raises ValueError if not found."""
        pass

    @abstractmethod
    def get_color(self, label_id: str) -> str | None:
        """Return the color for a label. Tier-3 labels inherit from their tier-2 parent."""
        pass
