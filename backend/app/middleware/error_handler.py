from typing import Any, Dict
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from backend.app.config import get_settings

from fastapi.encoders import jsonable_encoder

def _get_request_id(request: Request) -> str:
    return getattr(request.state, "request_id", None) or request.headers.get("X-Request-ID", "req-unknown")

def register_error_handlers(app: FastAPI):
    settings = get_settings()

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        req_id = _get_request_id(request)
        message = str(exc.detail) if isinstance(exc.detail, str) else "An error occurred"
        
        error_payload: Dict[str, Any] = {
            "code": f"HTTP_{exc.status_code}",
            "message": message,
            "request_id": req_id,
            "status_code": exc.status_code,
        }
        
        response_body = {
            "error": error_payload,
            "detail": exc.detail # Backward compatibility alias
        }
        return JSONResponse(status_code=exc.status_code, content=response_body, headers={"X-Request-ID": req_id})

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        req_id = _get_request_id(request)
        details = jsonable_encoder(exc.errors())
        message = "Validation error in request payload or parameters."
        
        error_payload: Dict[str, Any] = {
            "code": "VALIDATION_ERROR",
            "message": message,
            "request_id": req_id,
            "status_code": status.HTTP_422_UNPROCESSABLE_ENTITY,
            "fields": details
        }
        
        response_body = {
            "error": error_payload,
            "detail": details # Standard FastAPI compatibility alias
        }
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=response_body,
            headers={"X-Request-ID": req_id}
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        req_id = _get_request_id(request)
        
        # In debug mode, provide exception info; in production/staging, never leak stack traces
        if settings.DEBUG:
            message = f"Internal Server Error: {str(exc)}"
        else:
            message = "An internal server error occurred. Please reference the request ID when reporting."

        error_payload: Dict[str, Any] = {
            "code": "INTERNAL_SERVER_ERROR",
            "message": message,
            "request_id": req_id,
            "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR
        }

        response_body = {
            "error": error_payload,
            "detail": message
        }
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=response_body,
            headers={"X-Request-ID": req_id}
        )
