"""Question generation routes (/internal/v1/questions)."""

from __future__ import annotations

from fastapi import APIRouter, status

from app.pipelines.question_generation import (
    generate_follow_up_pipeline,
    generate_questions_pipeline,
)
from app.schemas.questions import (
    FollowUpGenerateRequest,
    FollowUpGenerateResponse,
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


@router.post(
    "/follow-up",
    response_model=FollowUpGenerateResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate an adaptive follow-up question based on previous evaluation",
)
async def generate_follow_up(payload: FollowUpGenerateRequest) -> FollowUpGenerateResponse:
    """Generate an adaptive follow-up question probing misconceptions, missing concepts, or scenarios."""
    return await generate_follow_up_pipeline(payload)
