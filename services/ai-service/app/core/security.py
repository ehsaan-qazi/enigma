"""Service-to-service authentication utilities."""

from fastapi import Header, HTTPException, status
from app.core.config import settings


async def verify_internal_secret(x_internal_secret: str = Header(default="")) -> None:
    if settings.AI_SERVICE_SECRET and x_internal_secret != settings.AI_SERVICE_SECRET:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal service credential.",
        )
