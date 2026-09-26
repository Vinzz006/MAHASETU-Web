import time
from collections import defaultdict
from threading import Lock

from backend.app.config import get_settings
from jose import JWTError, jwt
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse


class AppWideRateLimitMiddleware(BaseHTTPMiddleware):
    """
    App-wide sliding-window rate limiting middleware with tier-based thresholds:
    - Public / Anonymous: 60 req/min
    - Authenticated Citizens: 120 req/min
    - Department Officers & Staff: 300 req/min
    Bypassed in automated testing and on health checks.
    """

    def __init__(self, app):
        super().__init__(app)
        self.history: dict[str, list[float]] = defaultdict(list)
        self.lock = Lock()
        self.window = 60  # 1 minute window

    async def dispatch(self, request: Request, call_next):
        settings = get_settings()
        if settings.TESTING:
            return await call_next(request)

        path = request.url.path
        if path in ("/healthz", "/readyz", "/docs", "/redoc", "/api/v1/openapi.json"):
            return await call_next(request)

        # Determine caller identity and tier
        auth_header = request.headers.get("Authorization", "")
        client_ip = request.client.host if request.client else "127.0.0.1"
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()

        # Check role if token present
        limit = 60  # Default public tier
        key = f"ip:{client_ip}"

        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                payload = jwt.decode(
                    token,
                    settings.JWT_SECRET,
                    algorithms=["HS256"],
                    options={"verify_exp": False},
                )
                role = payload.get("role", "CITIZEN")
                sub = payload.get("sub", client_ip)
                key = f"user:{sub}"
                if role in (
                    "ADMIN",
                    "SYSTEM_ADMIN",
                    "OFFICER",
                    "AUDITOR",
                    "DEPARTMENT_A",
                    "DEPARTMENT_B",
                    "DEPARTMENT_C",
                ):
                    limit = 300  # Staff tier
                else:
                    limit = 120  # Citizen tier
            except (JWTError, TypeError, ValueError):
                limit = 60

        now = time.time()
        with self.lock:
            cutoff = now - self.window
            self.history[key] = [t for t in self.history[key] if t > cutoff]
            if len(self.history[key]) >= limit:
                req_id = getattr(
                    request.state, "request_id", None
                ) or request.headers.get("X-Request-ID", "req-unknown")
                return JSONResponse(
                    status_code=429,
                    headers={"Retry-After": str(self.window), "X-Request-ID": req_id},
                    content={
                        "error": {
                            "code": "RATE_LIMIT_EXCEEDED",
                            "message": f"Too many requests. Sane limit is {limit} requests per minute.",
                            "request_id": req_id,
                            "retry_after": self.window,
                        },
                        "detail": f"Rate limit exceeded. Maximum {limit} requests per minute allowed.",
                    },
                )
            self.history[key].append(now)

        return await call_next(request)
