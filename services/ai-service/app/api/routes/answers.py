"""Answer evaluation routes (/internal/v1/answers)."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.pipelines.answer_evaluation import evaluate_answer_pipeline
from app.pipelines.transcription import TranscriptionError
from app.schemas.answers import AnswerEvaluateRequest, AnswerEvaluateResponse

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
