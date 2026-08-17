from __future__ import annotations

from abc import ABC, abstractmethod

from ..models.label import Label, Tier


class LabelStore(ABC):
    @abstractmethod
    def list(self, tier: Tier | None = None) -> list[Label]:
        """List labels, optionally filtered by tier."""

    @abstractmethod
    def get(self, label_id: str) -> Label | None:
        """Return a label by id, or None."""

    @abstractmethod
    def get_by_name(self, name: str) -> Label | None:
        """Return the tier-3 label with the given name, or None."""

    @abstractmethod
    def create(self, name: str, parent_id: str) -> Label:
        """Create a new tier-3 label under a tier-2 parent.
        Raises ValueError if name already exists or parent is not tier 2."""

    @abstractmethod
    def remove(self, names: str | list[str]) -> list[Label]:
        """Remove tier-3 label(s) by name. Returns the removed labels."""

    @abstractmethod
    def modify(self, name: str, new_name: str | None = None) -> Label:
        """Rename a tier-3 label. Raises ValueError if not found."""

    @abstractmethod
    def get_color(self, label_id: str) -> str | None:
        """Return the color for a label. Tier-3 labels inherit from their tier-2 parent."""
