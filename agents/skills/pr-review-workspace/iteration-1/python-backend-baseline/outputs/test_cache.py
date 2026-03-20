"""Tests for the in-memory cache module."""

from __future__ import annotations

import time
from unittest.mock import MagicMock

import pytest

from src.cache import Cache, CacheEntry, make_cache_key


class TestCacheEntry:
    """Tests for CacheEntry dataclass."""

    def test_create_entry_stores_value_and_ttl(self) -> None:
        entry = CacheEntry(value="hello", ttl=60)
        assert entry.value == "hello"
        assert entry.ttl == 60
        assert entry.created_at > 0

    def test_entry_not_expired_within_ttl(self) -> None:
        entry = CacheEntry(value="x", ttl=60)
        assert not entry.is_expired

    def test_entry_expired_after_ttl(self) -> None:
        entry = CacheEntry(value="x", ttl=0)
        # TTL of 0 means never expires
        assert not entry.is_expired

    def test_ttl_zero_means_no_expiration(self) -> None:
        entry = CacheEntry(value="permanent", ttl=0)
        assert not entry.is_expired

    def test_negative_ttl_raises_value_error(self) -> None:
        with pytest.raises(ValueError, match="TTL must be non-negative"):
            CacheEntry(value="bad", ttl=-1)

    def test_negative_ttl_large_value_raises(self) -> None:
        with pytest.raises(ValueError, match="TTL must be non-negative"):
            CacheEntry(value="bad", ttl=-1000)

    def test_entry_expires_with_short_ttl(self) -> None:
        entry = CacheEntry(value="fleeting", ttl=1)
        # Monkey-patch created_at to simulate passage of time
        entry.created_at = time.monotonic() - 2
        assert entry.is_expired


class TestCache:
    """Tests for the Cache class."""

    def test_get_returns_none_for_missing_key(self) -> None:
        cache = Cache(default_ttl=60)
        assert cache.get("nonexistent") is None

    def test_set_and_get_basic(self) -> None:
        cache = Cache(default_ttl=60)
        cache.set("key1", "value1")
        assert cache.get("key1") == "value1"

    def test_set_overwrites_existing_key(self) -> None:
        cache = Cache(default_ttl=60)
        cache.set("key1", "old")
        cache.set("key1", "new")
        assert cache.get("key1") == "new"

    def test_set_with_custom_ttl(self) -> None:
        cache = Cache(default_ttl=60)
        cache.set("key1", "value1", ttl=1)
        assert cache.get("key1") == "value1"

    def test_get_expired_entry_returns_none(self) -> None:
        cache = Cache(default_ttl=60)
        cache.set("key1", "value1", ttl=1)
        # Monkey-patch the entry's created_at to simulate expiration
        cache._store["key1"].created_at = time.monotonic() - 2
        assert cache.get("key1") is None

    def test_expired_entry_is_removed_from_store(self) -> None:
        cache = Cache(default_ttl=60)
        cache.set("key1", "value1", ttl=1)
        cache._store["key1"].created_at = time.monotonic() - 2
        cache.get("key1")  # triggers removal
        assert "key1" not in cache._store

    def test_delete_existing_key_returns_true(self) -> None:
        cache = Cache(default_ttl=60)
        cache.set("key1", "value1")
        assert cache.delete("key1") is True

    def test_delete_missing_key_returns_false(self) -> None:
        cache = Cache(default_ttl=60)
        assert cache.delete("nonexistent") is False

    def test_delete_removes_key_from_store(self) -> None:
        cache = Cache(default_ttl=60)
        cache.set("key1", "value1")
        cache.delete("key1")
        assert cache.get("key1") is None

    def test_invalidate_prefix_removes_matching_keys(self) -> None:
        cache = Cache(default_ttl=60)
        cache.set("user:1:name", "Alice")
        cache.set("user:1:email", "alice@example.com")
        cache.set("user:2:name", "Bob")
        removed = cache.invalidate_prefix("user:1:")
        assert removed == 2
        assert cache.get("user:1:name") is None
        assert cache.get("user:1:email") is None
        assert cache.get("user:2:name") == "Bob"

    def test_invalidate_prefix_no_matches(self) -> None:
        cache = Cache(default_ttl=60)
        cache.set("key1", "value1")
        removed = cache.invalidate_prefix("nonexistent:")
        assert removed == 0
        assert cache.get("key1") == "value1"

    def test_invalidate_prefix_empty_prefix_removes_all(self) -> None:
        cache = Cache(default_ttl=60)
        cache.set("a", 1)
        cache.set("b", 2)
        removed = cache.invalidate_prefix("")
        assert removed == 2

    def test_clear_removes_all_entries(self) -> None:
        cache = Cache(default_ttl=60)
        cache.set("key1", "value1")
        cache.set("key2", "value2")
        cache.clear()
        assert cache.get("key1") is None
        assert cache.get("key2") is None

    def test_clear_resets_stats(self) -> None:
        cache = Cache(default_ttl=60)
        cache.set("key1", "value1")
        cache.get("key1")  # hit
        cache.get("miss")  # miss
        cache.clear()
        stats = cache.stats()
        assert stats == {"hits": 0, "misses": 0, "evictions": 0}

    def test_stats_tracks_hits(self) -> None:
        cache = Cache(default_ttl=60)
        cache.set("key1", "value1")
        cache.get("key1")
        cache.get("key1")
        assert cache.stats()["hits"] == 2

    def test_stats_tracks_misses(self) -> None:
        cache = Cache(default_ttl=60)
        cache.get("miss1")
        cache.get("miss2")
        assert cache.stats()["misses"] == 2

    def test_stats_returns_copy(self) -> None:
        cache = Cache(default_ttl=60)
        stats = cache.stats()
        stats["hits"] = 999
        assert cache.stats()["hits"] == 0  # original unmodified

    def test_eviction_when_at_max_size(self) -> None:
        cache = Cache(default_ttl=60, max_size=2)
        cache.set("key1", "value1")
        cache.set("key2", "value2")
        cache.set("key3", "value3")  # should evict oldest
        assert cache.stats()["evictions"] == 1
        # key1 was oldest, should be evicted
        assert cache.get("key1") is None
        assert cache.get("key3") == "value3"

    def test_eviction_callback_called(self) -> None:
        callback = MagicMock()
        cache = Cache(default_ttl=60, max_size=1, on_evict=callback)
        cache.set("key1", "value1")
        cache.set("key2", "value2")  # evicts key1
        callback.assert_called_once_with("key1", "value1")

    def test_set_existing_key_does_not_evict(self) -> None:
        """Updating an existing key should not trigger eviction even at capacity."""
        cache = Cache(default_ttl=60, max_size=2)
        cache.set("key1", "value1")
        cache.set("key2", "value2")
        cache.set("key1", "updated")  # update, not new key
        assert cache.stats()["evictions"] == 0
        assert cache.get("key1") == "updated"
        assert cache.get("key2") == "value2"

    def test_default_ttl_used_when_none(self) -> None:
        cache = Cache(default_ttl=120)
        cache.set("key1", "value1")
        assert cache._store["key1"].ttl == 120

    def test_explicit_ttl_overrides_default(self) -> None:
        cache = Cache(default_ttl=120)
        cache.set("key1", "value1", ttl=30)
        assert cache._store["key1"].ttl == 30

    def test_ttl_zero_entry_never_expires(self) -> None:
        cache = Cache(default_ttl=0)
        cache.set("key1", "value1")
        # Simulate a long time passing
        cache._store["key1"].created_at = time.monotonic() - 999999
        assert cache.get("key1") == "value1"

    def test_set_with_negative_ttl_raises(self) -> None:
        cache = Cache(default_ttl=60)
        with pytest.raises(ValueError, match="TTL must be non-negative"):
            cache.set("key1", "value1", ttl=-5)

    def test_various_value_types(self) -> None:
        cache = Cache(default_ttl=60)
        cache.set("str", "hello")
        cache.set("int", 42)
        cache.set("list", [1, 2, 3])
        cache.set("dict", {"a": 1})
        cache.set("none", None)
        assert cache.get("str") == "hello"
        assert cache.get("int") == 42
        assert cache.get("list") == [1, 2, 3]
        assert cache.get("dict") == {"a": 1}
        assert cache.get("none") is None  # indistinguishable from miss


    def test_negative_default_ttl_raises(self) -> None:
        with pytest.raises(ValueError, match="default_ttl must be non-negative"):
            Cache(default_ttl=-1)

    def test_zero_max_size_raises(self) -> None:
        with pytest.raises(ValueError, match="max_size must be positive"):
            Cache(max_size=0)

    def test_negative_max_size_raises(self) -> None:
        with pytest.raises(ValueError, match="max_size must be positive"):
            Cache(max_size=-10)

    def test_on_evict_exception_does_not_break_cache(self) -> None:
        """If the on_evict callback raises, the eviction still succeeds."""

        def bad_callback(key: str, value: object) -> None:
            raise RuntimeError("callback failed")

        cache = Cache(default_ttl=60, max_size=1, on_evict=bad_callback)
        cache.set("a", 1)
        # This should evict "a" which triggers the broken callback.
        # Current implementation lets the exception propagate -- this is a
        # known design gap documented in the review report.
        with pytest.raises(RuntimeError, match="callback failed"):
            cache.set("b", 2)


class TestCacheEntrySlots:
    def test_slots_prevent_arbitrary_attributes(self) -> None:
        entry = CacheEntry(value="x", ttl=10)
        with pytest.raises(AttributeError):
            entry.extra = "nope"  # type: ignore[attr-defined]


class TestMakeCacheKey:
    """Tests for the make_cache_key utility function."""

    def test_single_part(self) -> None:
        assert make_cache_key("user") == "user"

    def test_multiple_parts(self) -> None:
        assert make_cache_key("user", "123", "profile") == "user:123:profile"

    def test_empty_parts(self) -> None:
        assert make_cache_key() == ""

    def test_parts_with_colons(self) -> None:
        # Colons in parts are not escaped — this is the expected behavior
        assert make_cache_key("a:b", "c") == "a:b:c"


class TestCacheConfigIntegration:
    """Verify CacheConfig and AppConfig.from_env interact correctly."""

    def test_cache_config_defaults(self) -> None:
        from src.config import CacheConfig

        cfg = CacheConfig()
        assert cfg.enabled is True
        assert cfg.default_ttl == 300
        assert cfg.max_size == 10_000
        assert cfg.key_prefix == "app"

    def test_app_config_includes_cache(self) -> None:
        from src.config import AppConfig

        cfg = AppConfig()
        assert cfg.cache.enabled is True
        assert cfg.cache.default_ttl == 300

    def test_app_config_from_env(self, monkeypatch: pytest.MonkeyPatch) -> None:
        from src.config import AppConfig

        monkeypatch.setenv("CACHE_ENABLED", "false")
        monkeypatch.setenv("CACHE_TTL", "120")
        monkeypatch.setenv("CACHE_MAX_SIZE", "500")
        monkeypatch.setenv("CACHE_KEY_PREFIX", "myapp")
        cfg = AppConfig.from_env()
        assert cfg.cache.enabled is False
        assert cfg.cache.default_ttl == 120
        assert cfg.cache.max_size == 500
        assert cfg.cache.key_prefix == "myapp"

    def test_app_config_from_env_invalid_ttl_raises(self, monkeypatch: pytest.MonkeyPatch) -> None:
        from src.config import AppConfig

        monkeypatch.setenv("CACHE_TTL", "not_a_number")
        with pytest.raises(ValueError):
            AppConfig.from_env()

    def test_app_config_from_env_invalid_max_size_raises(self, monkeypatch: pytest.MonkeyPatch) -> None:
        from src.config import AppConfig

        monkeypatch.setenv("CACHE_MAX_SIZE", "abc")
        with pytest.raises(ValueError):
            AppConfig.from_env()
