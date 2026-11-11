"""Document analysis routes (/internal/v1/documents)."""

from fastapi import APIRouter

router = APIRouter()


@router.post("/analyze")
async def analyze_document():
    """Analyze uploaded academic document and extract key concepts."""
    return {"status": "stub", "endpoint": "/internal/v1/documents/analyze"}
