import os
import time
from collections import defaultdict
from threading import Lock
from typing import Dict, List
from fastapi import Request, HTTPException, status

class SlidingWindowRateLimiter:
    """
    Thread-safe, sliding-window in-memory rate limiter for sensitive authentication and public routes.
    Protects against brute-force and credential stuffing.
    """
    def __init__(self, requests_limit: int, window_seconds: int, name: str = "RateLimiter"):
        self.limit = requests_limit
        self.window = window_seconds
        self.name = name
        self.history: Dict[str, List[float]] = defaultdict(list)
        self.lock = Lock()

    def check(self, key: str) -> bool:
        # In automated pytest testing mode, allow high burst throughput to not disrupt unit suites
        if os.getenv("TESTING", "false").lower() in ("true", "1"):
            return True

        now = time.time()
        with self.lock:
            cutoff = now - self.window
            # Prune expired timestamps
            self.history[key] = [t for t in self.history[key] if t > cutoff]
            if len(self.history[key]) >= self.limit:
                return False
            self.history[key].append(now)
            return True

    def __call__(self, request: Request):
        client_ip = request.client.host if request.client else "127.0.0.1"
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()

        key = f"{self.name}:{client_ip}"
        if not self.check(key):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded: Maximum {self.limit} requests allowed per {self.window} seconds.",
                headers={"Retry-After": str(self.window)}
            )

# Predefined rate limiters for sensitive endpoints
# 10 login attempts per minute per IP
login_rate_limiter = SlidingWindowRateLimiter(requests_limit=10, window_seconds=60, name="LoginLimiter")
# 10 registration requests per minute per IP
register_rate_limiter = SlidingWindowRateLimiter(requests_limit=10, window_seconds=60, name="RegisterLimiter")
# 30 public passport verification requests per minute per IP
verify_rate_limiter = SlidingWindowRateLimiter(requests_limit=30, window_seconds=60, name="VerifyLimiter")
# 15 AI assistant queries per minute per citizen/IP
assistant_rate_limiter = SlidingWindowRateLimiter(requests_limit=15, window_seconds=60, name="AssistantLimiter")
