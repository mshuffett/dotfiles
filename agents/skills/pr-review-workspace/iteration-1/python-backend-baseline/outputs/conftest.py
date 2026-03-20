"""Shared test fixtures."""

from __future__ import annotations

import pytest

from src.cache import Cache
from src.config import AppConfig, CacheConfig, DatabaseConfig


@pytest.fixture
def app_config() -> AppConfig:
    """Return a test application config."""
    return AppConfig(
        debug=True,
        log_level="DEBUG",
        db=DatabaseConfig(
            host="localhost",
            port=5432,
            name="test_db",
            user="test",
            password="test_pass",
            pool_size=2,
        ),
        cache=CacheConfig(
            enabled=True,
            default_ttl=60,
            max_size=100,
            key_prefix="test",
        ),
    )


@pytest.fixture
def cache() -> Cache:
    """Return a Cache instance with short TTL for testing."""
    return Cache(default_ttl=60, max_size=5)
