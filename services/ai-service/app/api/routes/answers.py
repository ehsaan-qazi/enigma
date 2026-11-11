"""Answer evaluation and speech transcription routes (/internal/v1/answers)."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.pipelines.answer_evaluation import evaluate_answer_pipeline
from app.pipelines.transcription import TranscriptionError, resolve_transcription
from app.schemas.answers import (
    AnswerEvaluateRequest,
    AnswerEvaluateResponse,
    TranscriptionRequest,
    TranscriptionResponse,
)

router = APIRouter()


@router.post(
    "/evaluate",
    response_model=AnswerEvaluateResponse,
    status_code=status.HTTP_200_OK,
    summary="Transcribe and evaluate student viva response against expected concepts",
)
async def evaluate_answer(payload: AnswerEvaluateRequest) -> AnswerEvaluateResponse:
    """Evaluate a transcribed or audio student answer with evidence-based reasoning."""
    try:
        return await evaluate_answer_pipeline(payload)
    except TranscriptionError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc


@router.post(
    "/transcribe",
    response_model=TranscriptionResponse,
    status_code=status.HTTP_200_OK,
    summary="Transcribe student audio recording to text",
)
async def transcribe_answer_audio(payload: TranscriptionRequest) -> TranscriptionResponse:
    """Standalone speech-to-text endpoint for student audio recordings."""
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
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
