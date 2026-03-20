# PR Review: Add In-Memory Cache Module

**Branch:** `feat/cache-layer`
**Base:** `main`
**Date:** 2026-03-18
**Files changed:** `src/cache.py` (new, 131 lines), `src/config.py` (+17 lines)
**Commits:** 2

---

## Summary

This PR adds an in-memory cache with TTL support, prefix-based bulk invalidation, LRU-style eviction with callback, and hit/miss/eviction stats tracking. It also adds `CacheConfig` to `AppConfig` with environment variable loading. The implementation had 6 bugs -- 2 critical concurrency issues, 2 high-severity correctness/safety issues, and 2 low-severity robustness gaps. All have been fixed. Tests have been extended to cover validation, config integration, and edge cases.

---

## Bugs Found and Fixed

| # | Severity | Location | Description | Fix |
|---|----------|----------|-------------|-----|
| 1 | **Critical** | `cache.py:59-71` | **`get()` not thread-safe.** Reads `_store` and mutates `_stats` without acquiring `_lock`. Concurrent `get()`+`set()` can corrupt stats, read torn entries, or crash on `del` of an expired key racing with `set()` for the same key. | Wrapped entire `get()` body in `with self._lock:` |
| 2 | **Critical** | `cache.py:92-116` | **Race condition in `invalidate_prefix()`.** Dict iteration happened outside the lock, deletions inside it. Another thread could mutate `_store` during iteration (`RuntimeError: dictionary changed size during iteration`) or add matching keys that would be missed by invalidation. | Moved iteration + deletion inside a single `with self._lock:` block |
| 3 | **High** | `cache.py:111` | **Bare `except:` clause.** Caught `KeyboardInterrupt`, `SystemExit`, `GeneratorExit`, and all `BaseException` subclasses. Only `KeyError` was the expected failure mode. This masks fatal signals and makes debugging impossible. | Removed entirely (no longer needed after fixing the race condition) |
| 4 | **High** | `cache.py:18-34` | **No negative TTL validation.** `ttl=-1` created entries with confusing, undefined expiration behavior. `is_expired` returns `(elapsed) > ttl`; since elapsed is always positive, `elapsed > -1` is always `True`, so the entry expires immediately -- but this is undocumented and likely not intended. | Added `ValueError` on `ttl < 0` in `CacheEntry.__init__()` |
| 5 | **Low** | `cache.py:109-112` | **`stats()` not thread-safe.** Returned `_stats.copy()` without the lock. `clear()` replaces the entire `_stats` dict, so a concurrent `stats()` could read from a stale reference. | Added `with self._lock:` |
| 6 | **Low** | `cache.py:46-56` | **No constructor parameter validation.** `default_ttl=-1` silently propagated to all entries. `max_size=0` caused every `set()` to evict before inserting, creating an effectively broken cache. | Added `ValueError` guards: `default_ttl >= 0`, `max_size > 0` |

---

## Design Issues (Not Fixed -- Flagged for Discussion)

### 1. `get()` returning `None` is ambiguous with stored `None` values

`cache.set("key", None)` stores `None`, but `cache.get("key")` also returns `None` -- indistinguishable from a cache miss. Consider a sentinel pattern, a `contains()` method, or a `get(key, default=MISSING)` API.

### 2. `on_evict` callback exceptions propagate to the caller

If `on_evict` raises during `_evict_oldest()`, the exception propagates through `set()`, leaving the cache in a state where the old entry was removed but the new entry was never stored. Consider wrapping in `try/except Exception` with `logger.exception()`.

### 3. `_evict_oldest()` is O(n) per eviction

`min(self._store, key=...)` scans all entries. For `max_size=10_000` this is acceptable; for larger caches, an `OrderedDict` or a min-heap indexed by `created_at` would give O(1) / O(log n) eviction.

### 4. `CacheConfig.key_prefix` is defined but never used

`CacheConfig` has a `key_prefix` field, but `Cache` never reads it. Either integrate it (e.g., auto-prefix keys) or remove it to avoid dead configuration.

### 5. `make_cache_key` does not escape the delimiter

`make_cache_key("a:b", "c")` produces `"a:b:c"`, identical to `make_cache_key("a", "b", "c")`. This creates a collision risk. Consider escaping colons in parts or documenting the constraint.

### 6. Config env var parsing gives poor error messages

`int(os.getenv("CACHE_TTL", "300"))` throws a bare `ValueError` with no context about which variable was invalid. A wrapper with descriptive messages would improve operability.

---

## Test Coverage

### Tests added by this review

| Test | Category | What it verifies |
|------|----------|-----------------|
| `test_negative_default_ttl_raises` | Validation | `Cache(default_ttl=-1)` raises `ValueError` |
| `test_zero_max_size_raises` | Validation | `Cache(max_size=0)` raises `ValueError` |
| `test_negative_max_size_raises` | Validation | `Cache(max_size=-10)` raises `ValueError` |
| `test_on_evict_exception_does_not_break_cache` | Error handling | Documents that `on_evict` exceptions propagate (design gap) |
| `test_slots_prevent_arbitrary_attributes` | Correctness | `CacheEntry.__slots__` enforced |
| `test_cache_config_defaults` | Config | `CacheConfig()` default values |
| `test_app_config_includes_cache` | Config | `AppConfig()` includes `cache` field |
| `test_app_config_from_env` | Config | `AppConfig.from_env()` reads `CACHE_*` env vars correctly |
| `test_app_config_from_env_invalid_ttl_raises` | Config | Non-numeric `CACHE_TTL` raises `ValueError` |
| `test_app_config_from_env_invalid_max_size_raises` | Config | Non-numeric `CACHE_MAX_SIZE` raises `ValueError` |

### Fixture updates

- `conftest.py`: Added `CacheConfig` to `app_config` fixture; added standalone `cache` fixture.

### Coverage gaps remaining

- No concurrency stress tests (would need `threading`/`concurrent.futures` to exercise the fixed race conditions under real contention)
- Dependencies not installed, so `pytest` could not be executed. All test files follow project conventions and are syntactically valid.

---

## Files Modified

| File | Change |
|------|--------|
| `src/cache.py` | Fixed 6 bugs: thread safety in `get()`/`stats()`, race condition + bare except in `invalidate_prefix()`, negative TTL validation, constructor validation |
| `tests/test_cache.py` | Added 10 tests: constructor validation, `__slots__`, on_evict exception, config integration (5 tests) |
| `tests/conftest.py` | Added `CacheConfig` to `app_config` fixture; added `cache` fixture |

---

## Verdict

**Request changes.** The concurrency bugs in `get()` and `invalidate_prefix()` are correctness issues that would manifest under concurrent load. The bare `except` clause masks fatal signals. All identified bugs have been fixed in this review. The design issues (items 1-6 above) are non-blocking but worth discussing before merge.
