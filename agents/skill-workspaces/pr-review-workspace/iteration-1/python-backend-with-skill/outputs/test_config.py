"""Tests for the configuration module, focused on CacheConfig additions."""

from __future__ import annotations

import os
from unittest.mock import patch

import pytest

from src.config import AppConfig, CacheConfig, DatabaseConfig


class TestCacheConfig:
    """Tests for the CacheConfig dataclass."""

    def test_default_values(self) -> None:
        config = CacheConfig()
        assert config.enabled is True
        assert config.default_ttl == 300
        assert config.max_size == 10_000
        assert config.key_prefix == "app"

    def test_custom_values(self) -> None:
        config = CacheConfig(enabled=False, default_ttl=60, max_size=500, key_prefix="svc")
        assert config.enabled is False
        assert config.default_ttl == 60
        assert config.max_size == 500
        assert config.key_prefix == "svc"

    def test_frozen_immutable(self) -> None:
        config = CacheConfig()
        with pytest.raises(AttributeError):
            config.enabled = False  # type: ignore[misc]


class TestAppConfigWithCache:
    """Tests for AppConfig's new cache field."""

    def test_default_app_config_has_cache(self) -> None:
        config = AppConfig()
        assert isinstance(config.cache, CacheConfig)
        assert config.cache.enabled is True

    def test_from_env_cache_defaults(self) -> None:
        """With no env vars set, cache uses defaults."""
        with patch.dict(os.environ, {}, clear=True):
            config = AppConfig.from_env()
        assert config.cache.enabled is True
        assert config.cache.default_ttl == 300
        assert config.cache.max_size == 10_000
        assert config.cache.key_prefix == "app"

    def test_from_env_cache_custom_values(self) -> None:
        env = {
            "CACHE_ENABLED": "false",
            "CACHE_TTL": "60",
            "CACHE_MAX_SIZE": "500",
            "CACHE_KEY_PREFIX": "test",
        }
        with patch.dict(os.environ, env, clear=True):
            config = AppConfig.from_env()
        assert config.cache.enabled is False
        assert config.cache.default_ttl == 60
        assert config.cache.max_size == 500
        assert config.cache.key_prefix == "test"

    def test_from_env_cache_enabled_case_insensitive(self) -> None:
        with patch.dict(os.environ, {"CACHE_ENABLED": "TRUE"}, clear=True):
            config = AppConfig.from_env()
        assert config.cache.enabled is True

        with patch.dict(os.environ, {"CACHE_ENABLED": "True"}, clear=True):
            config = AppConfig.from_env()
        assert config.cache.enabled is True

    def test_from_env_invalid_ttl_raises(self) -> None:
        with patch.dict(os.environ, {"CACHE_TTL": "not_a_number"}, clear=True):
            with pytest.raises(ValueError):
                AppConfig.from_env()

    def test_from_env_invalid_max_size_raises(self) -> None:
        with patch.dict(os.environ, {"CACHE_MAX_SIZE": "abc"}, clear=True):
            with pytest.raises(ValueError):
                AppConfig.from_env()

    def test_from_env_preserves_db_config(self) -> None:
        """Adding cache config should not break existing DB config loading."""
        env = {
            "DB_HOST": "dbhost",
            "DB_PORT": "5433",
            "CACHE_TTL": "120",
        }
        with patch.dict(os.environ, env, clear=True):
            config = AppConfig.from_env()
        assert config.db.host == "dbhost"
        assert config.db.port == 5433
        assert config.cache.default_ttl == 120
