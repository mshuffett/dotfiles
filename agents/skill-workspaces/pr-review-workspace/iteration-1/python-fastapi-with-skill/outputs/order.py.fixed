from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum


class OrderStatus(Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    SHIPPED = "shipped"
    CANCELLED = "cancelled"


class Order:
    """Represents a customer order."""

    def __init__(
        self,
        order_id: int,
        customer_id: int,
        amount: float,
        items: list[str] | None = None,
        status: OrderStatus = OrderStatus.PENDING,
        created_at: datetime | None = None,
    ):
        if amount < 0:
            raise ValueError("Order amount must be non-negative")
        self.order_id = order_id
        self.customer_id = customer_id
        self.amount = amount
        self.items = items if items is not None else []
        self.status = status
        self.created_at = created_at or datetime.now(timezone.utc)

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Order):
            return NotImplemented
        return self.order_id == other.order_id

    def __hash__(self) -> int:
        return hash(self.order_id)

    def __repr__(self) -> str:
        return (
            f"Order(id={self.order_id}, customer={self.customer_id}, "
            f"amount={self.amount}, status={self.status.value})"
        )

    def to_dict(self) -> dict:
        return {
            "order_id": self.order_id,
            "customer_id": self.customer_id,
            "amount": self.amount,
            "items": self.items,
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
        }
