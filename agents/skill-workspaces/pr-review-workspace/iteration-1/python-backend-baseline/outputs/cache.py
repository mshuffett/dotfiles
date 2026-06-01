"""In-memory cache with TTL support and write-through invalidation."""

from __future__ import annotations

import logging
import threading
import time
from typing import Any, Callable

logger = logging.getLogger(__name__)


class CacheEntry:
    """A single cached value with expiration metadata."""

    __slots__ = ("value", "created_at", "ttl")

    def __init__(self, value: Any, ttl: int) -> None:
        if ttl < 0:
            raise ValueError(f"TTL must be non-negative, got {ttl}")
        self.value = value
        self.created_at = time.monotonic()
        self.ttl = ttl

    @property
    def is_expired(self) -> bool:
        if self.ttl == 0:
            return False  # TTL of 0 means no expiration
        return (time.monotonic() - self.created_at) > self.ttl


class Cache:
    """Thread-safe in-memory cache.

    Supports:
    - Per-key TTL
    - Bulk invalidation by prefix
    - Optional write-through callback
    """

    def __init__(
        self,
        default_ttl: int = 300,
        max_size: int = 10_000,
        on_evict: Callable[[str, Any], None] | None = None,
    ) -> None:
        if default_ttl < 0:
            raise ValueError(f"default_ttl must be non-negative, got {default_ttl}")
        if max_size <= 0:
            raise ValueError(f"max_size must be positive, got {max_size}")
        self._store: dict[str, CacheEntry] = {}
        self._default_ttl = default_ttl
        self._max_size = max_size
        self._on_evict = on_evict
        self._lock = threading.Lock()
        self._stats = {"hits": 0, "misses": 0, "evictions": 0}

    def get(self, key: str) -> Any | None:
        """Retrieve a value by key, returning None if missing or expired."""
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                self._stats["misses"] += 1
                return None
            if entry.is_expired:
                del self._store[key]
                self._stats["misses"] += 1
                return None
            self._stats["hits"] += 1
            return entry.value

    def set(self, key: str, value: Any, ttl: int | None = None) -> None:
        """Store a value with optional TTL override."""
        effective_ttl = ttl if ttl is not None else self._default_ttl

        with self._lock:
            # Evict oldest entries if at capacity
            if len(self._store) >= self._max_size and key not in self._store:
                self._evict_oldest()

            self._store[key] = CacheEntry(value, effective_ttl)

    def delete(self, key: str) -> bool:
        """Remove a single key. Returns True if the key existed."""
        with self._lock:
            if key in self._store:
                del self._store[key]
                return True
            return False

    def invalidate_prefix(self, prefix: str) -> int:
        """Remove all keys matching a prefix. Returns count of removed keys.

        NOTE: This is intended for cache invalidation on data writes,
        e.g. invalidate_prefix("user:123:") clears all cached data for user 123.
        """
        with self._lock:
            keys_to_remove = [k for k in self._store if k.startswith(prefix)]
            for key in keys_to_remove:
                del self._store[key]
            return len(keys_to_remove)

    def clear(self) -> None:
        """Remove all entries."""
        with self._lock:
            self._store.clear()
            self._stats = {"hits": 0, "misses": 0, "evictions": 0}

    def stats(self) -> dict[str, int]:
        """Return cache hit/miss/eviction statistics."""
        with self._lock:
            return self._stats.copy()

    def _evict_oldest(self) -> None:
        """Remove the oldest entry to make room for a new one."""
        if not self._store:
            return
        oldest_key = min(self._store, key=lambda k: self._store[k].created_at)
        entry = self._store.pop(oldest_key)
        self._stats["evictions"] += 1
        if self._on_evict:
            self._on_evict(oldest_key, entry.value)


def make_cache_key(*parts: str) -> str:
    """Build a namespaced cache key from parts.

    Example: make_cache_key("user", "123", "profile") -> "user:123:profile"
    """
    return ":".join(parts)
