"""Enigma Independent Python AI Service — Owned by Adil."""

from __future__ import annotations

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.api.dependencies import verify_internal_secret
from app.api.routes import answers, documents, questions
from app.core.config import settings
from app.core.security import InternalSecretAuthMiddleware
from app.pipelines.transcription import TranscriptionError, resolve_transcription
from app.schemas.answers import TranscriptionRequest, TranscriptionResponse

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


@app.post(
    "/internal/v1/transcribe",
    response_model=TranscriptionResponse,
    status_code=200,
    tags=["Transcription"],
    dependencies=[Depends(verify_internal_secret)],
    summary="Transcribe student audio recording to text (Next.js BFF adapter endpoint)",
)
async def transcribe_audio_endpoint(payload: TranscriptionRequest) -> TranscriptionResponse:
    """Transcribe audio recording from storage path, signed URL, or base64 payload."""
    try:
        text = await resolve_transcription(
            audio_base64=payload.audio_base64,
            audio_url=payload.audio_url,
            audio_storage_path=payload.audio_storage_path,
            audio_mime_type=payload.audio_mime_type,
        )
        return TranscriptionResponse(transcription=text)
    except TranscriptionError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError):
    """Return structured 422 validation errors."""
    return JSONResponse(
        status_code=422,
        content=jsonable_encoder(
            {
                "detail": exc.errors(),
                "error_code": "VALIDATION_ERROR",
            }
        ),
    )


@app.get("/health", tags=["Health"])
async def health_check():
    """Public health check endpoint for container orchestration and uptime checks."""
    return {
        "status": "ok",
        "service": "enigma-ai-service",
        "version": settings.APP_VERSION,
    }
