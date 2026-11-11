"""Answer evaluation routes (/internal/v1/answers)."""

from fastapi import APIRouter

router = APIRouter()


@router.post("/evaluate")
async def evaluate_answer():
    """Evaluate transcribed student answer against expected concepts."""
    return {"status": "stub", "endpoint": "/internal/v1/answers/evaluate"}
