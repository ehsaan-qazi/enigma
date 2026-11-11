"""Document analysis routes (/internal/v1/documents)."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.pipelines.document_analysis import (
    DocumentExtractionError,
    analyze_document_pipeline,
)
from app.schemas.documents import DocumentAnalyzeRequest, DocumentAnalyzeResponse

router = APIRouter()


@router.post(
    "/analyze",
    response_model=DocumentAnalyzeResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze uploaded academic document and extract key concepts",
)
async def analyze_document(payload: DocumentAnalyzeRequest) -> DocumentAnalyzeResponse:
    """Analyze uploaded academic document (text, base64 PDF, or signed URL) and extract concepts."""
    try:
        return await analyze_document_pipeline(payload)
    except DocumentExtractionError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
