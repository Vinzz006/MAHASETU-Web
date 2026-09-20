import json
import time
from typing import Any, Optional
import redis
from backend.app.config import get_settings

class CacheManager:
    """Unified cache layer supporting Redis with an in-memory fallback."""
    def __init__(self):
        settings = get_settings()
        self._memory_cache: dict[str, tuple[Any, float]] = {}
        self._redis_client: Optional[redis.Redis] = None
        self._redis_available = False

        try:
            client = redis.from_url(settings.REDIS_URL, decode_responses=True, socket_connect_timeout=0.5)
            client.ping()
            self._redis_client = client
            self._redis_available = True
            print("[MahaSetu Cache] Connected to Redis cache backend.")
        except Exception:
            self._redis_available = False

    def get(self, key: str) -> Optional[Any]:
        if self._redis_available and self._redis_client:
            try:
                data = self._redis_client.get(key)
                if data is not None:
                    return json.loads(data)
                return None
            except Exception:
                self._redis_available = False

        # In-memory fallback
        if key in self._memory_cache:
            val, expiry = self._memory_cache[key]
            if time.time() < expiry:
                try:
                    from backend.app.services.metrics import metrics_service
                    metrics_service.record_cache_hit()
                except Exception:
                    pass
                return val
            else:
                del self._memory_cache[key]

        try:
            from backend.app.services.metrics import metrics_service
            metrics_service.record_cache_miss()
        except Exception:
            pass
        return None

    def set(self, key: str, value: Any, ttl_seconds: int = 30) -> None:
        if self._redis_available and self._redis_client:
            try:
                self._redis_client.setex(key, ttl_seconds, json.dumps(value, default=str))
                return
            except Exception:
                self._redis_available = False

        # In-memory fallback
        self._memory_cache[key] = (value, time.time() + ttl_seconds)

    def delete(self, key: str) -> None:
        if self._redis_available and self._redis_client:
            try:
                self._redis_client.delete(key)
            except Exception:
                self._redis_available = False
        self._memory_cache.pop(key, None)

    def invalidate_prefix(self, prefix: str) -> None:
        if self._redis_available and self._redis_client:
            try:
                keys = self._redis_client.keys(f"{prefix}*")
                if keys:
                    self._redis_client.delete(*keys)
            except Exception:
                self._redis_available = False

        # In-memory cleanup
        to_del = [k for k in self._memory_cache if k.startswith(prefix)]
        for k in to_del:
            del self._memory_cache[k]

cache = CacheManager()
