import hashlib
import json
from typing import Optional
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from backend.app.services.cache import cache

IDEMPOTENT_PATHS = {
    "/api/v1/applications",
    "/api/v1/consent",
    "/api/v1/workflow/action",
    "/api/applications",
    "/api/consent",
    "/api/workflow/action",
}

class IdempotencyMiddleware(BaseHTTPMiddleware):
    """
    Ensures safe state-changing operations across flaky connections.
    If an 'Idempotency-Key' header is supplied, duplicates within 24 hours
    are served directly from cache without re-executing transactions or creating duplicate audit entries.
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        if request.method not in ("POST", "PUT", "PATCH"):
            return await call_next(request)

        idempotency_key = request.headers.get("Idempotency-Key", "").strip()
        if not idempotency_key:
            return await call_next(request)

        # Match on target path
        path = request.url.path.rstrip("/")
        if not any(path.startswith(target) for target in IDEMPOTENT_PATHS):
            return await call_next(request)

        cache_key = f"idempotency:{idempotency_key}:{path}"
        existing = cache.get(cache_key)

        if existing:
            if existing.get("status") == "PROCESSING":
                return JSONResponse(
                    status_code=409,
                    content={"error": {"code": "CONCURRENT_REQUEST", "message": "A request with this Idempotency-Key is currently being processed. Please retry shortly."}}
                )
            # Replay cached response
            headers = {"X-Idempotent-Replay": "true", "X-Request-ID": request.headers.get("X-Request-ID", "")}
            return Response(
                content=existing.get("body", "").encode("utf-8"),
                status_code=existing.get("status_code", 200),
                media_type="application/json",
                headers=headers
            )

        # Mark as processing
        cache.set(cache_key, {"status": "PROCESSING"}, ttl_seconds=30)

        # Execute request
        response: Response = await call_next(request)

        # Cache successful response for 24 hours (86400 seconds)
        if response.status_code in (200, 201):
            response_body = b""
            async for chunk in response.body_iterator:
                response_body += chunk

            # If response was compressed with gzip, decompress it before caching text
            if response.headers.get("content-encoding") == "gzip":
                import gzip
                try:
                    decoded_body = gzip.decompress(response_body).decode("utf-8")
                except Exception:
                    decoded_body = response_body.decode("utf-8", errors="replace")
            else:
                decoded_body = response_body.decode("utf-8", errors="replace")

            cache.set(
                cache_key,
                {
                    "status": "COMPLETED",
                    "status_code": response.status_code,
                    "body": decoded_body
                },
                ttl_seconds=86400
            )

            # Reconstruct response since iterator was consumed
            headers = dict(response.headers)
            headers["Idempotency-Key"] = idempotency_key
            return Response(
                content=response_body,
                status_code=response.status_code,
                headers=headers,
                media_type=response.media_type
            )
        else:
            # On error, clear the lock so citizen can correct and retry immediately
            cache.delete(cache_key)
            return response
