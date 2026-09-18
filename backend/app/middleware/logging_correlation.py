import time
import uuid
import json
import logging
from contextvars import ContextVar
from typing import Optional
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

# Context variable to hold the current request ID across async tasks
request_id_ctx: ContextVar[str] = ContextVar("request_id_ctx", default="")
user_id_ctx: ContextVar[str] = ContextVar("user_id_ctx", default="")

class JSONLogFormatter(logging.Formatter):
    """Outputs log records formatted as single-line JSON objects."""
    def format(self, record: logging.LogRecord) -> str:
        log_obj = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": request_id_ctx.get() or getattr(record, "request_id", ""),
            "user_id": user_id_ctx.get() or getattr(record, "user_id", ""),
        }
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_obj)

def setup_structured_logging():
    """Configures the root logger with JSONLogFormatter."""
    root_logger = logging.getLogger()
    # Avoid duplicate handlers
    if not any(isinstance(h.formatter, JSONLogFormatter) for h in root_logger.handlers):
        handler = logging.StreamHandler()
        handler.setFormatter(JSONLogFormatter())
        root_logger.handlers = [handler]
        root_logger.setLevel(logging.INFO)

class RequestCorrelationMiddleware(BaseHTTPMiddleware):
    """Propagates or generates X-Request-ID and logs structured request timings."""
    async def dispatch(self, request: Request, call_next) -> Response:
        # Get existing or generate new request ID
        req_id = request.headers.get("X-Request-ID") or f"req-{uuid.uuid4().hex[:12]}"
        request.state.request_id = req_id
        token = request_id_ctx.set(req_id)

        start_time = time.perf_counter()
        user_id = ""

        try:
            response: Response = await call_next(request)
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            response.headers["X-Request-ID"] = req_id

            # Extract user if available on state
            user_id = getattr(request.state, "user_id", "")
            if user_id:
                user_id_ctx.set(user_id)

            # Skip spamming logs for health check polls
            if request.url.path not in ("/healthz", "/readyz", "/api/health", "/metrics"):
                logging.getLogger("mahasetu.access").info(
                    f"{request.method} {request.url.path} -> {response.status_code} ({duration_ms}ms)",
                    extra={"request_id": req_id, "user_id": user_id, "status_code": response.status_code, "duration_ms": duration_ms}
                )

            # Record Prometheus metrics
            try:
                from backend.app.services.metrics import metrics_service
                duration_seconds = time.perf_counter() - start_time
                metrics_service.record_request(request.method, request.url.path, response.status_code, duration_seconds)
            except Exception:
                pass

            return response
        except Exception as exc:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logging.getLogger("mahasetu.error").error(
                f"Unhandled error in {request.method} {request.url.path}: {str(exc)}",
                exc_info=True,
                extra={"request_id": req_id, "duration_ms": duration_ms}
            )
            raise exc
        finally:
            request_id_ctx.reset(token)
