"""Question generation routes (/internal/v1/questions)."""

from fastapi import APIRouter

router = APIRouter()


@router.post("/generate")
async def generate_questions():
    """Generate personalized primary viva questions from extracted concepts."""
    return {"status": "stub", "endpoint": "/internal/v1/questions/generate"}


@router.post("/follow-up")
async def generate_follow_up():
    """Generate an adaptive follow-up question based on previous evaluation."""
    return {"status": "stub", "endpoint": "/internal/v1/questions/follow-up"}
