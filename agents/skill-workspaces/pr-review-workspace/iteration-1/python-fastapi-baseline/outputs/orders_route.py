import sqlite3
from typing import Any

from fastapi import APIRouter, HTTPException, Query

from src.models.order import Order, OrderStatus

router = APIRouter()

# In-memory store for demo
_orders: dict[int, Order] = {}
_next_id: int = 1

DATABASE_PATH = "store.db"


def _get_db() -> sqlite3.Connection:
    return sqlite3.connect(DATABASE_PATH)


@router.post("/", status_code=201)
async def create_order(
    customer_id: int,
    amount: float,
    items: list[str] | None = None,
) -> dict[str, Any]:
    global _next_id
    if amount < 0:
        raise HTTPException(status_code=422, detail="Amount must be non-negative")
    order = Order(
        order_id=_next_id,
        customer_id=customer_id,
        amount=amount,
        items=items or [],
    )
    _orders[_next_id] = order
    _next_id += 1
    return order.to_dict()


@router.get("/")
async def list_orders(
    customer_id: int | None = None,
    status: str | None = None,
) -> list[dict[str, Any]]:
    results = list(_orders.values())
    if customer_id is not None:
        results = [o for o in results if o.customer_id == customer_id]
    if status is not None:
        results = [o for o in results if o.status.value == status]
    return [o.to_dict() for o in results]


# NOTE: search/by-status must be defined BEFORE /{order_id} to avoid
# FastAPI matching "search" as an order_id path parameter.
@router.get("/search/by-status")
async def search_orders_by_status(
    status_filter: str = Query(..., description="Order status to filter by"),
) -> list[dict]:
    conn = _get_db()
    try:
        cursor = conn.cursor()
        # Use parameterized query to prevent SQL injection
        query = "SELECT * FROM orders WHERE status = ?"
        cursor.execute(query, (status_filter,))
        rows = cursor.fetchall()
        return [{"order_id": r[0], "status": r[1], "amount": r[2]} for r in rows]
    finally:
        conn.close()


@router.get("/{order_id}")
async def get_order(order_id: int) -> dict[str, Any]:
    if order_id not in _orders:
        raise HTTPException(status_code=404, detail="Order not found")
    return _orders[order_id].to_dict()


@router.patch("/{order_id}/cancel")
async def cancel_order(order_id: int) -> dict[str, Any]:
    if order_id not in _orders:
        raise HTTPException(status_code=404, detail="Order not found")
    order = _orders[order_id]
    if order.status == OrderStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Order is already cancelled")
    if order.status == OrderStatus.SHIPPED:
        raise HTTPException(status_code=400, detail="Cannot cancel a shipped order")
    order.status = OrderStatus.CANCELLED
    return order.to_dict()
