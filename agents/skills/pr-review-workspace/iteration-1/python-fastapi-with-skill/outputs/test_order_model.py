"""Unit tests for the Order model."""

from datetime import datetime, timezone

import pytest

from src.models.order import Order, OrderStatus


class TestOrderInit:
    """Test Order construction and defaults."""

    def test_create_order_with_required_fields(self):
        order = Order(order_id=1, customer_id=10, amount=99.99)
        assert order.order_id == 1
        assert order.customer_id == 10
        assert order.amount == 99.99
        assert order.items == []
        assert order.status == OrderStatus.PENDING
        assert isinstance(order.created_at, datetime)

    def test_create_order_with_all_fields(self):
        dt = datetime(2026, 1, 1, tzinfo=timezone.utc)
        order = Order(
            order_id=2,
            customer_id=20,
            amount=50.0,
            items=["widget", "gadget"],
            status=OrderStatus.CONFIRMED,
            created_at=dt,
        )
        assert order.items == ["widget", "gadget"]
        assert order.status == OrderStatus.CONFIRMED
        assert order.created_at == dt

    def test_negative_amount_raises_value_error(self):
        with pytest.raises(ValueError, match="non-negative"):
            Order(order_id=1, customer_id=1, amount=-10.0)

    def test_zero_amount_is_valid(self):
        order = Order(order_id=1, customer_id=1, amount=0.0)
        assert order.amount == 0.0

    def test_mutable_default_not_shared(self):
        """Verify the mutable-default-argument bug is fixed.

        Previously items defaulted to [], causing all instances to share
        the same list object.
        """
        order_a = Order(order_id=1, customer_id=1, amount=10.0)
        order_b = Order(order_id=2, customer_id=1, amount=20.0)
        order_a.items.append("only-for-a")
        assert order_b.items == [], "items list must not be shared between instances"


class TestOrderEquality:
    """Test __eq__ and __hash__."""

    def test_equal_by_order_id(self):
        a = Order(order_id=1, customer_id=1, amount=10.0)
        b = Order(order_id=1, customer_id=2, amount=99.0)
        assert a == b

    def test_not_equal_different_id(self):
        a = Order(order_id=1, customer_id=1, amount=10.0)
        b = Order(order_id=2, customer_id=1, amount=10.0)
        assert a != b

    def test_not_equal_to_non_order(self):
        a = Order(order_id=1, customer_id=1, amount=10.0)
        assert a != "not an order"

    def test_hashable(self):
        """Verify __hash__ is defined so Orders can be used in sets/dicts."""
        a = Order(order_id=1, customer_id=1, amount=10.0)
        b = Order(order_id=1, customer_id=2, amount=99.0)
        s = {a, b}
        assert len(s) == 1

    def test_different_orders_different_hash(self):
        a = Order(order_id=1, customer_id=1, amount=10.0)
        b = Order(order_id=2, customer_id=1, amount=10.0)
        # Not guaranteed by contract, but should hold for simple int hashing
        assert hash(a) != hash(b)


class TestOrderRepr:
    def test_repr_format(self):
        order = Order(order_id=5, customer_id=42, amount=19.99)
        r = repr(order)
        assert "id=5" in r
        assert "customer=42" in r
        assert "19.99" in r
        assert "pending" in r


class TestOrderToDict:
    def test_to_dict_keys(self):
        order = Order(order_id=1, customer_id=1, amount=10.0, items=["a"])
        d = order.to_dict()
        assert set(d.keys()) == {
            "order_id",
            "customer_id",
            "amount",
            "items",
            "status",
            "created_at",
        }

    def test_to_dict_values(self):
        dt = datetime(2026, 3, 18, 12, 0, 0, tzinfo=timezone.utc)
        order = Order(
            order_id=3,
            customer_id=7,
            amount=25.50,
            items=["x"],
            status=OrderStatus.SHIPPED,
            created_at=dt,
        )
        d = order.to_dict()
        assert d["order_id"] == 3
        assert d["customer_id"] == 7
        assert d["amount"] == 25.50
        assert d["items"] == ["x"]
        assert d["status"] == "shipped"
        assert d["created_at"] == dt.isoformat()

    def test_to_dict_empty_items(self):
        order = Order(order_id=1, customer_id=1, amount=0.0)
        assert order.to_dict()["items"] == []
