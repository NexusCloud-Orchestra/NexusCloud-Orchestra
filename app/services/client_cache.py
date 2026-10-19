"""Thread-safe TTL + LRU cache for cloud SDK clients, keyed by connection and credential hash."""
from __future__ import annotations

import hashlib
import json
import threading
import time
from collections import OrderedDict
from typing import Callable, TypeVar

T = TypeVar("T")


class ClientCache:
    def __init__(self, maxsize: int = 256, ttl_seconds: float = 300.0, clock: Callable[[], float] = time.monotonic):
        self._maxsize = maxsize
        self._ttl = ttl_seconds
        self._clock = clock
        self._lock = threading.Lock()
        self._items: OrderedDict[tuple, tuple[float, object]] = OrderedDict()

    def get_or_create(self, key: tuple, factory: Callable[[], T]) -> T:
        with self._lock:
            now = self._clock()
            entry = self._items.get(key)
            if entry is not None and now - entry[0] <= self._ttl:
                self._items.move_to_end(key)
                return entry[1]  # type: ignore[return-value]
            value = factory()
            self._items[key] = (now, value)
            self._items.move_to_end(key)
            while len(self._items) > self._maxsize:
                self._items.popitem(last=False)
            return value

    def clear(self) -> None:
        with self._lock:
            self._items.clear()


def client_key(provider_name: str, connection, credentials: dict) -> tuple:
    """Cache key; credentials are hashed so raw secrets never sit in the key."""
    digest = hashlib.sha256(json.dumps(credentials, sort_keys=True).encode()).hexdigest()
    return (provider_name, str(getattr(connection, "id", None)), digest)


provider_clients = ClientCache()
