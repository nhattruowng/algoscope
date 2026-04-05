from __future__ import annotations

from dataclasses import dataclass
from hashlib import sha256
from threading import Lock
from time import time
from typing import Any


@dataclass
class CacheEntry:
    value: Any
    expires_at: float


class TTLMemoryCache:
    def __init__(self, ttl_seconds: int = 120, max_entries: int = 128) -> None:
        self.ttl_seconds = ttl_seconds
        self.max_entries = max_entries
        self._store: dict[str, CacheEntry] = {}
        self._lock = Lock()
        self.hits = 0
        self.misses = 0

    def make_key(self, *parts: str) -> str:
        raw = "||".join(parts)
        return sha256(raw.encode("utf-8")).hexdigest()

    def get(self, key: str) -> Any | None:
        with self._lock:
            self._prune_locked()
            entry = self._store.get(key)
            if entry is None:
                self.misses += 1
                return None
            self.hits += 1
            return entry.value

    def set(self, key: str, value: Any) -> None:
        with self._lock:
            self._prune_locked()
            if len(self._store) >= self.max_entries:
                oldest_key = min(self._store, key=lambda item: self._store[item].expires_at)
                self._store.pop(oldest_key, None)
            self._store[key] = CacheEntry(value=value, expires_at=time() + self.ttl_seconds)

    def stats(self) -> dict[str, int]:
        with self._lock:
            self._prune_locked()
            return {
                "entries": len(self._store),
                "hits": self.hits,
                "misses": self.misses,
                "ttl_seconds": self.ttl_seconds,
                "max_entries": self.max_entries,
            }

    def _prune_locked(self) -> None:
        now = time()
        expired = [key for key, entry in self._store.items() if entry.expires_at <= now]
        for key in expired:
            self._store.pop(key, None)

