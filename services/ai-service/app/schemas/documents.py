"""Pydantic v2 schemas for document analysis and concept extraction."""

from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator


class ExtractedConcept(BaseModel):
    """Detailed representation of an academic concept extracted from a student submission."""

    model_config = ConfigDict(extra="ignore")

    name: str = Field(..., min_length=1, description="Canonical name of the concept.")
    description: str = Field(
        default="",
        description="Contextual summary of how the concept is used in the document.",
    )
    importance: Literal["core", "supporting", "advanced"] = Field(
        default="core",
        description="Relative importance of the concept to the submission.",
    )
    technical_terms: List[str] = Field(
        default_factory=list,
        description="Domain-specific terminology associated with this concept.",
    )
    relationships: List[str] = Field(
        default_factory=list,
        description="Related concepts or dependencies within the submission.",
    )
    question_angles: List[str] = Field(
        default_factory=list,
        description="Potential angles for viva questioning on this concept.",
    )


class DocumentAnalyzeOptions(BaseModel):
    """Optional processing flags for document analysis."""

    model_config = ConfigDict(extra="ignore")

    max_concepts: int = Field(default=10, ge=1, le=25)
    include_question_candidates: bool = Field(default=True)


class DocumentAnalyzeRequest(BaseModel):
    """Request payload for POST /internal/v1/documents/analyze."""

    model_config = ConfigDict(extra="ignore")

    submission_id: Optional[str] = Field(
        default=None,
        description="UUID or identifier of the student submission.",
    )
    title: Optional[str] = Field(
        default=None,
        description="Optional submission title.",
    )
    content: Optional[str] = Field(
        default=None,
        description="Plain text content of the academic document (if already extracted).",
    )
    pdf_base64: Optional[str] = Field(
        default=None,
        description="Base64-encoded PDF file bytes for server-side PDF text extraction.",
    )
    file_url: Optional[str] = Field(
        default=None,
        description="Signed URL to download the PDF or text document from private storage.",
    )
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional document metadata (e.g. filename, mime_type, course).",
    )
    options: DocumentAnalyzeOptions = Field(
        default_factory=DocumentAnalyzeOptions,
        description="Analysis configuration options.",
    )

    @model_validator(mode="after")
    def validate_document_source(self) -> "DocumentAnalyzeRequest":
        has_content = bool(self.content and self.content.strip())
        has_pdf = bool(self.pdf_base64 and self.pdf_base64.strip())
        has_url = bool(self.file_url and self.file_url.strip())
        if not (has_content or has_pdf or has_url):
            raise ValueError(
                "At least one document input must be provided: 'content', 'pdf_base64', or 'file_url'."
            )
        return self


class DocumentAnalyzeResponse(BaseModel):
    """Response payload for POST /internal/v1/documents/analyze."""

    model_config = ConfigDict(extra="ignore")

    submission_id: Optional[str] = Field(default=None)
    summary: str = Field(..., min_length=1, description="Concise summary of the submitted work.")
    topics: List[str] = Field(..., min_length=1, description="High-level academic topics identified.")
    concepts: List[str] = Field(..., min_length=1, description="Names of key concepts extracted.")
    extracted_concepts: List[ExtractedConcept] = Field(
        default_factory=list,
        description="Structured concept objects with relationships and questioning angles.",
    )
    technical_terminology: List[str] = Field(
        default_factory=list,
        description="Important technical terms used in the submission.",
    )
    methods_and_approaches: List[str] = Field(
        default_factory=list,
        description="Methodologies, design choices, or architectural approaches identified.",
    )
    algorithms_and_implementations: List[str] = Field(
        default_factory=list,
        description="Algorithms, data structures, or concrete implementation details found.",
    )
    question_candidates: List[str] = Field(
        default_factory=list,
        description="Candidate areas or prompts for deeper viva investigation.",
    )
    extracted_text_length: int = Field(
        default=0,
        ge=0,
        description="Character length of the extracted document text.",
    )
