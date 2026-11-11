"""Service-to-service authentication utilities for Enigma AI Service."""

from __future__ import annotations

import hmac
import os
from typing import Optional

from fastapi import Header, HTTPException, Request, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.core.config import settings


def _extract_secret(
    x_internal_secret: Optional[str],
    authorization: Optional[str],
) -> str:
    if x_internal_secret:
        return x_internal_secret.strip()
    if authorization and authorization.lower().startswith("bearer "):
        return authorization[7:].strip()
    return ""


def _expected_secret() -> str:
    # Check both settings.AI_SERVICE_SECRET and live os.environ for test overrides
    return (settings.AI_SERVICE_SECRET or os.getenv("AI_SERVICE_SECRET", "")).strip()


async def verify_internal_secret(
    x_internal_secret: Optional[str] = Header(default=None, alias="X-Internal-Secret"),
    authorization: Optional[str] = Header(default=None, alias="Authorization"),
) -> None:
    """Verify the shared internal secret sent by the Next.js Backend BFF."""
    expected = _expected_secret()
    if not expected:
        # In local development without AI_SERVICE_SECRET set, allow requests.
        return

    provided = _extract_secret(x_internal_secret, authorization)
    if not provided or not hmac.compare_digest(provided, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing internal service credential (X-Internal-Secret).",
        )


class InternalSecretAuthMiddleware(BaseHTTPMiddleware):
    """Middleware enforcing X-Internal-Secret on all /internal/v1/* routes."""

    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith("/internal/"):
            expected = _expected_secret()
            if expected:
                provided = _extract_secret(
                    request.headers.get("X-Internal-Secret"),
                    request.headers.get("Authorization"),
                )
                if not provided or not hmac.compare_digest(provided, expected):
                    return JSONResponse(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        content={
                            "detail": "Invalid or missing internal service credential (X-Internal-Secret).",
                            "error_code": "UNAUTHORIZED_INTERNAL_CALLER",
                        },
                    )
        return await call_next(request)
