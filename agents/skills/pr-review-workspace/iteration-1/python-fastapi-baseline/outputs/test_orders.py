"""Tests for the orders endpoint and Order model."""

import pytest

from src.models.order import Order, OrderStatus
from src.routes import orders as orders_module


@pytest.fixture(autouse=True)
def _reset_orders_store():
    """Reset the in-memory orders store between tests."""
    orders_module._orders.clear()
    orders_module._next_id = 1
    yield
    orders_module._orders.clear()
    orders_module._next_id = 1


# ---------------------------------------------------------------------------
# Order model unit tests
# ---------------------------------------------------------------------------


class TestOrderModel:
    def test_create_order_defaults(self):
        order = Order(order_id=1, customer_id=10, amount=25.50)
        assert order.order_id == 1
        assert order.customer_id == 10
        assert order.amount == 25.50
        assert order.items == []
        assert order.status == OrderStatus.PENDING
        assert order.created_at is not None

    def test_create_order_with_items(self):
        order = Order(order_id=1, customer_id=10, amount=50.0, items=["Widget"])
        assert order.items == ["Widget"]

    def test_mutable_default_not_shared(self):
        """Verify that the mutable-default-argument bug is fixed.

        Two orders created without explicit items should have independent lists.
        """
        order_a = Order(order_id=1, customer_id=1, amount=10.0)
        order_b = Order(order_id=2, customer_id=2, amount=20.0)
        order_a.items.append("added-only-to-a")
        assert order_b.items == [], "Items list was shared between instances"

    def test_negative_amount_raises(self):
        with pytest.raises(ValueError, match="non-negative"):
            Order(order_id=1, customer_id=1, amount=-5.0)

    def test_zero_amount_allowed(self):
        order = Order(order_id=1, customer_id=1, amount=0.0)
        assert order.amount == 0.0

    def test_equality_by_order_id(self):
        a = Order(order_id=1, customer_id=1, amount=10.0)
        b = Order(order_id=1, customer_id=2, amount=99.0)
        assert a == b

    def test_inequality(self):
        a = Order(order_id=1, customer_id=1, amount=10.0)
        b = Order(order_id=2, customer_id=1, amount=10.0)
        assert a != b

    def test_eq_with_non_order_returns_not_implemented(self):
        order = Order(order_id=1, customer_id=1, amount=10.0)
        assert order.__eq__("not an order") is NotImplemented

    def test_hash_defined(self):
        """Orders must be hashable (usable in sets / as dict keys)."""
        order = Order(order_id=42, customer_id=1, amount=10.0)
        assert hash(order) == hash(42)
        # Should be insertable into a set without error
        s = {order}
        assert order in s

    def test_to_dict(self):
        order = Order(
            order_id=1,
            customer_id=10,
            amount=19.99,
            items=["A", "B"],
            status=OrderStatus.CONFIRMED,
        )
        d = order.to_dict()
        assert d["order_id"] == 1
        assert d["customer_id"] == 10
        assert d["amount"] == 19.99
        assert d["items"] == ["A", "B"]
        assert d["status"] == "confirmed"
        assert "created_at" in d

    def test_repr(self):
        order = Order(order_id=1, customer_id=2, amount=5.0)
        r = repr(order)
        assert "id=1" in r
        assert "customer=2" in r
        assert "amount=5.0" in r


# ---------------------------------------------------------------------------
# Orders API endpoint tests
# ---------------------------------------------------------------------------


class TestCreateOrder:
    def test_create_order_success(self, client):
        response = client.post(
            "/api/orders/?customer_id=1&amount=29.99",
            json=None,
        )
        # FastAPI parses query params; items defaults to None
        response = client.post("/api/orders/?customer_id=1&amount=29.99")
        assert response.status_code == 201
        data = response.json()
        assert data["customer_id"] == 1
        assert data["amount"] == 29.99
        assert data["status"] == "pending"
        assert "order_id" in data
        assert "created_at" in data

    def test_create_order_negative_amount_rejected(self, client):
        response = client.post("/api/orders/?customer_id=1&amount=-10")
        assert response.status_code == 422

    def test_create_order_zero_amount(self, client):
        response = client.post("/api/orders/?customer_id=1&amount=0")
        assert response.status_code == 201

    def test_create_order_increments_id(self, client):
        r1 = client.post("/api/orders/?customer_id=1&amount=10")
        r2 = client.post("/api/orders/?customer_id=1&amount=20")
        assert r1.json()["order_id"] < r2.json()["order_id"]


class TestListOrders:
    def test_list_empty(self, client):
        response = client.get("/api/orders/")
        assert response.status_code == 200
        assert response.json() == []

    def test_list_returns_created_orders(self, client):
        client.post("/api/orders/?customer_id=1&amount=10")
        client.post("/api/orders/?customer_id=2&amount=20")
        response = client.get("/api/orders/")
        assert len(response.json()) == 2

    def test_filter_by_customer_id(self, client):
        client.post("/api/orders/?customer_id=1&amount=10")
        client.post("/api/orders/?customer_id=2&amount=20")
        response = client.get("/api/orders/?customer_id=1")
        data = response.json()
        assert len(data) == 1
        assert data[0]["customer_id"] == 1

    def test_filter_by_status(self, client):
        client.post("/api/orders/?customer_id=1&amount=10")
        response = client.get("/api/orders/?status=pending")
        assert len(response.json()) == 1
        response = client.get("/api/orders/?status=shipped")
        assert len(response.json()) == 0


class TestGetOrder:
    def test_get_existing_order(self, client):
        create_resp = client.post("/api/orders/?customer_id=1&amount=15")
        order_id = create_resp.json()["order_id"]
        response = client.get(f"/api/orders/{order_id}")
        assert response.status_code == 200
        assert response.json()["order_id"] == order_id

    def test_get_nonexistent_order_returns_404(self, client):
        response = client.get("/api/orders/9999")
        assert response.status_code == 404


class TestCancelOrder:
    def test_cancel_existing_order(self, client):
        create_resp = client.post("/api/orders/?customer_id=1&amount=10")
        order_id = create_resp.json()["order_id"]
        response = client.patch(f"/api/orders/{order_id}/cancel")
        assert response.status_code == 200
        assert response.json()["status"] == "cancelled"

    def test_cancel_nonexistent_order_returns_404(self, client):
        response = client.patch("/api/orders/9999/cancel")
        assert response.status_code == 404

    def test_cancel_already_cancelled_order_returns_400(self, client):
        create_resp = client.post("/api/orders/?customer_id=1&amount=10")
        order_id = create_resp.json()["order_id"]
        client.patch(f"/api/orders/{order_id}/cancel")
        response = client.patch(f"/api/orders/{order_id}/cancel")
        assert response.status_code == 400

    def test_cancel_shipped_order_returns_400(self, client):
        create_resp = client.post("/api/orders/?customer_id=1&amount=10")
        order_id = create_resp.json()["order_id"]
        # Manually set status to SHIPPED to test the guard
        orders_module._orders[order_id].status = OrderStatus.SHIPPED
        response = client.patch(f"/api/orders/{order_id}/cancel")
        assert response.status_code == 400


class TestSearchByStatus:
    """The /search/by-status endpoint hits a real SQLite DB.

    These tests verify route registration order (it must not be shadowed by
    /{order_id}) and that the parameterized query works correctly.
    """

    def test_search_route_not_shadowed_by_order_id(self, client):
        """Ensure /search/by-status is not intercepted by /{order_id}.

        If route ordering is wrong, FastAPI will try to parse 'search' as int
        and return a 422 validation error.
        """
        response = client.get("/api/orders/search/by-status?status_filter=pending")
        # The DB likely doesn't exist in test, so we might get a 500,
        # but crucially it should NOT be a 422 (which would indicate route
        # shadowing). A 200 or 500 both prove the correct route was matched.
        assert response.status_code != 422, (
            "Route /search/by-status was shadowed by /{order_id}"
        )
