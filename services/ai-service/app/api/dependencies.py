"""FastAPI route dependencies."""

from app.core.security import verify_internal_secret

__all__ = ["verify_internal_secret"]
