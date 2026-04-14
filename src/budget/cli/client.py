import httpx
from datetime import date
from typing import Optional


DEFAULT_BASE_URL = "http://localhost:8000"


class BudgetClient:
    def __init__(self, base_url: str = DEFAULT_BASE_URL) -> None:
        self._base_url = base_url

    def _url(self, path: str) -> str:
        return f"{self._base_url}{path}"

    # --- Transactions ---

    def upload(self, file_path: str) -> list[dict]:
        with open(file_path, "rb") as f:
            resp = httpx.post(self._url("/transactions/upload"), files={"file": f})
        resp.raise_for_status()
        return resp.json()

    def list_transactions(
        self,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        description: Optional[str] = None,
        amount_op: Optional[str] = None,
        amount_value: Optional[float] = None,
    ) -> list[dict]:
        params: dict = {}
        if date_from is not None:
            params["date_from"] = date_from.isoformat()
        if date_to is not None:
            params["date_to"] = date_to.isoformat()
        if description is not None:
            params["description"] = description
        if amount_op is not None:
            params["amount_op"] = amount_op
        if amount_value is not None:
            params["amount_value"] = amount_value

        resp = httpx.get(self._url("/transactions"), params=params)
        resp.raise_for_status()
        return resp.json()

    def remove_transactions(self, ids: list[str]) -> list[dict]:
        resp = httpx.post(self._url("/transactions/remove"), json={"ids": ids})
        resp.raise_for_status()
        return resp.json()

    def modify_transaction(
        self,
        ids: list[str],
        description: Optional[str] = None,
        label: Optional[str] = None,
    ) -> list[dict]:
        body: dict = {"ids": ids}
        if description is not None:
            body["description"] = description
        if label is not None:
            body["label"] = label
        resp = httpx.post(self._url("/transactions/modify"), json=body)
        resp.raise_for_status()
        return resp.json()

    # --- Labels ---

    def list_labels(self) -> list[dict]:
        resp = httpx.get(self._url("/labels"))
        resp.raise_for_status()
        return resp.json()

    def create_label(self, name: str, color: str) -> dict:
        resp = httpx.post(self._url("/labels"), json={"name": name, "color": color})
        resp.raise_for_status()
        return resp.json()

    def modify_label(
        self,
        name: str,
        new_name: Optional[str] = None,
        color: Optional[str] = None,
    ) -> dict:
        body: dict = {}
        if new_name is not None:
            body["new_name"] = new_name
        if color is not None:
            body["color"] = color
        resp = httpx.post(self._url(f"/labels/{name}/modify"), json=body)
        resp.raise_for_status()
        return resp.json()

    def remove_labels(self, names: list[str]) -> list[dict]:
        resp = httpx.post(self._url("/labels/remove"), json={"ids": names})
        resp.raise_for_status()
        return resp.json()
