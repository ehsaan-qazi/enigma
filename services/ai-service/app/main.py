"""Enigma Independent Python AI Service — Owned by Adil."""

from __future__ import annotations

from fastapi import Depends, FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.api.dependencies import verify_internal_secret
from app.api.routes import answers, documents, questions
from app.core.config import settings
from app.core.security import InternalSecretAuthMiddleware

app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Internal FastAPI service for document intelligence, personalized viva question "
        "generation, speech-to-text transcription, and evidence-based answer evaluation."
    ),
    version=settings.APP_VERSION,
)

app.add_middleware(InternalSecretAuthMiddleware)

app.include_router(
    documents.router,
    prefix="/internal/v1/documents",
    tags=["Documents"],
    dependencies=[Depends(verify_internal_secret)],
)
app.include_router(
    questions.router,
    prefix="/internal/v1/questions",
    tags=["Questions"],
    dependencies=[Depends(verify_internal_secret)],
)
app.include_router(
    answers.router,
    prefix="/internal/v1/answers",
    tags=["Answers"],
    dependencies=[Depends(verify_internal_secret)],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError):
    """Return structured 422 validation errors."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": exc.errors(),
            "error_code": "VALIDATION_ERROR",
        },
    )


@app.get("/health", tags=["Health"])
async def health_check():
    """Public health check endpoint for container orchestration and uptime checks."""
    return {
        "status": "ok",
        "service": "enigma-ai-service",
        "version": settings.APP_VERSION,
    }
