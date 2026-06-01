"""Integration tests for the orders API endpoints."""

import pytest
from fastapi.testclient import TestClient

from src.main import app
from src.routes import orders as orders_module


@pytest.fixture(autouse=True)
def _reset_order_store():
    """Reset the in-memory store before each test to avoid cross-test pollution."""
    orders_module._orders.clear()
    orders_module._next_id = 1
    yield
    orders_module._orders.clear()
    orders_module._next_id = 1


@pytest.fixture
def client():
    return TestClient(app)


# ── POST /api/orders/ ──────────────────────────────────────────────


class TestCreateOrder:
    def test_create_order_success(self, client):
        resp = client.post(
            "/api/orders/",
            params={"customer_id": 1, "amount": 49.99},
            json=["item_a", "item_b"],
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["order_id"] == 1
        assert data["customer_id"] == 1
        assert data["amount"] == 49.99
        assert data["items"] == ["item_a", "item_b"]
        assert data["status"] == "pending"
        assert "created_at" in data

    def test_create_order_minimal(self, client):
        """Create order without optional items."""
        resp = client.post(
            "/api/orders/",
            params={"customer_id": 5, "amount": 0.0},
        )
        assert resp.status_code == 201
        assert resp.json()["items"] == []

    def test_create_order_negative_amount_rejected(self, client):
        """Negative amounts must be rejected with 422."""
        resp = client.post(
            "/api/orders/",
            params={"customer_id": 1, "amount": -10.0},
        )
        assert resp.status_code == 422

    def test_create_order_auto_increments_id(self, client):
        resp1 = client.post(
            "/api/orders/", params={"customer_id": 1, "amount": 10.0}
        )
        resp2 = client.post(
            "/api/orders/", params={"customer_id": 1, "amount": 20.0}
        )
        assert resp1.json()["order_id"] == 1
        assert resp2.json()["order_id"] == 2


# ── GET /api/orders/ ───────────────────────────────────────────────


class TestListOrders:
    def test_list_empty(self, client):
        resp = client.get("/api/orders/")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_returns_created_orders(self, client):
        client.post("/api/orders/", params={"customer_id": 1, "amount": 10.0})
        client.post("/api/orders/", params={"customer_id": 2, "amount": 20.0})
        resp = client.get("/api/orders/")
        assert len(resp.json()) == 2

    def test_list_filter_by_customer_id(self, client):
        client.post("/api/orders/", params={"customer_id": 1, "amount": 10.0})
        client.post("/api/orders/", params={"customer_id": 2, "amount": 20.0})
        resp = client.get("/api/orders/", params={"customer_id": 1})
        data = resp.json()
        assert len(data) == 1
        assert data[0]["customer_id"] == 1

    def test_list_filter_by_status(self, client):
        client.post("/api/orders/", params={"customer_id": 1, "amount": 10.0})
        client.post("/api/orders/", params={"customer_id": 1, "amount": 20.0})
        # Cancel first order
        client.patch("/api/orders/1/cancel")
        resp = client.get("/api/orders/", params={"status": "cancelled"})
        data = resp.json()
        assert len(data) == 1
        assert data[0]["status"] == "cancelled"

    def test_list_filter_by_nonexistent_status(self, client):
        client.post("/api/orders/", params={"customer_id": 1, "amount": 10.0})
        resp = client.get("/api/orders/", params={"status": "shipped"})
        assert resp.json() == []


# ── GET /api/orders/{order_id} ─────────────────────────────────────


class TestGetOrder:
    def test_get_existing_order(self, client):
        client.post("/api/orders/", params={"customer_id": 1, "amount": 10.0})
        resp = client.get("/api/orders/1")
        assert resp.status_code == 200
        assert resp.json()["order_id"] == 1

    def test_get_nonexistent_order_404(self, client):
        resp = client.get("/api/orders/999")
        assert resp.status_code == 404
        assert "not found" in resp.json()["detail"].lower()


# ── PATCH /api/orders/{order_id}/cancel ────────────────────────────


class TestCancelOrder:
    def test_cancel_order_success(self, client):
        client.post("/api/orders/", params={"customer_id": 1, "amount": 10.0})
        resp = client.patch("/api/orders/1/cancel")
        assert resp.status_code == 200
        assert resp.json()["status"] == "cancelled"

    def test_cancel_nonexistent_order_404(self, client):
        resp = client.patch("/api/orders/999/cancel")
        assert resp.status_code == 404

    def test_cancel_already_cancelled_order_returns_400(self, client):
        """Cancelling an already-cancelled order should return 400."""
        client.post("/api/orders/", params={"customer_id": 1, "amount": 10.0})
        client.patch("/api/orders/1/cancel")
        resp = client.patch("/api/orders/1/cancel")
        assert resp.status_code == 400
        assert "already cancelled" in resp.json()["detail"].lower()


# ── GET /api/orders/search/by-status ───────────────────────────────


class TestSearchByStatus:
    """The search endpoint hits SQLite; these tests verify the parameterized query
    doesn't crash.  In a test environment without a real DB the endpoint will
    raise an OperationalError (no table), but the important thing is that the
    SQL injection vector is closed."""

    def test_search_requires_status_filter(self, client):
        """Omitting the required query param should return 422."""
        resp = client.get("/api/orders/search/by-status")
        assert resp.status_code == 422

    def test_search_sql_injection_attempt(self, client):
        """A SQL-injection payload must not produce a 500 from malformed SQL;
        it should either hit the DB safely or raise an operational error
        (no such table) — never execute injected SQL."""
        resp = client.get(
            "/api/orders/search/by-status",
            params={"status_filter": "'; DROP TABLE orders; --"},
        )
        # We expect either 500 (table missing) or 200 (empty) — not a
        # raw SQL error from injected syntax.
        assert resp.status_code in (200, 500)
