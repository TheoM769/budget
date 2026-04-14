from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Optional

from ..models import Label


class LabelStore(ABC):
    @abstractmethod
    def list(self) -> list[Label]:
        pass

    @abstractmethod
    def create(self, name: str, color: str) -> Label:
        """Create a new label. Raises ValueError if name already exists."""
        pass

    @abstractmethod
    def remove(self, names: str | list[str]) -> list[Label]:
        """Remove label(s) by name. Returns the removed labels."""
        pass

    @abstractmethod
    def modify(self, name: str, new_name: Optional[str] = None, color: Optional[str] = None) -> Label:
        """Modify a label's name and/or color. Raises ValueError if not found."""
        pass
