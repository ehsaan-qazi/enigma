"""Question generation routes (/internal/v1/questions)."""

from __future__ import annotations

from fastapi import APIRouter, status

from app.pipelines.question_generation import generate_questions_pipeline
from app.schemas.questions import (
    QuestionGenerateRequest,
    QuestionGenerateResponse,
)

router = APIRouter()


@router.post(
    "/generate",
    response_model=QuestionGenerateResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate personalized primary viva questions from extracted concepts",
)
async def generate_questions(payload: QuestionGenerateRequest) -> QuestionGenerateResponse:
    """Generate personalized primary viva questions with difficulty and expected_concepts."""
    return await generate_questions_pipeline(payload)


@router.post("/follow-up")
async def generate_follow_up():
    """Generate an adaptive follow-up question based on previous evaluation."""
    return {"status": "stub", "endpoint": "/internal/v1/questions/follow-up"}
