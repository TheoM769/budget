import pytest
from fastapi.testclient import TestClient

from budget.adapters.tsv_label_store import TsvLabelStore
from budget.api import app as app_module


@pytest.fixture
def client(tmp_path, monkeypatch):
    """API client backed by a temporary (seeded) label store."""
    monkeypatch.setattr(
        app_module, "label_store", TsvLabelStore(tmp_path / "labels.tsv")
    )
    return TestClient(app_module.app)


def test_list_labels_returns_all_labels(client):
    expected = app_module.label_store.list()

    response = client.get("/labels")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == len(expected)
    assert [lb["id"] for lb in body] == [lb.id for lb in expected]


def test_list_labels_filtered_by_tier(client):
    response = client.get("/labels", params={"tier": 3})

    assert response.status_code == 200
    body = response.json()
    assert body
    assert all(lb["tier"] == 3 for lb in body)
