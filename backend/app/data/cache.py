import asyncio
import time
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class CacheEntry:
    value: Any
    stored_at: float


class AsyncTtlCache:
    def __init__(self) -> None:
        self._entries: dict[str, CacheEntry] = {}
        self._locks: dict[str, asyncio.Lock] = {}

    def cached_keys(self) -> list[str]:
        return list(self._entries)

    def peek(self, key: str) -> Any | None:
        entry = self._entries.get(key)
        return entry.value if entry else None

    def age_seconds(self, key: str) -> float | None:
        entry = self._entries.get(key)
        return time.monotonic() - entry.stored_at if entry else None

    async def get_or_fetch[T](self, key: str, ttl_seconds: float, fetch: Callable[[], Awaitable[T]]) -> T:
        fresh = self._fresh_entry(key, ttl_seconds)
        if fresh is not None:
            return fresh.value
        lock = self._locks.setdefault(key, asyncio.Lock())
        async with lock:
            fresh = self._fresh_entry(key, ttl_seconds)
            if fresh is not None:
                return fresh.value
            stale = self._entries.get(key)
            try:
                value = await fetch()
            except Exception:
                if stale is not None:
                    return stale.value
                raise
            self._entries[key] = CacheEntry(value=value, stored_at=time.monotonic())
            return value

    def _fresh_entry(self, key: str, ttl_seconds: float) -> CacheEntry | None:
        entry = self._entries.get(key)
        if entry is None or time.monotonic() - entry.stored_at >= ttl_seconds:
            return None
        return entry
