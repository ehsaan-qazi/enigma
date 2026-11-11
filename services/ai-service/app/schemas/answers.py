"""Pydantic v2 schemas for speech-to-text transcription and evidence-based answer evaluation."""

from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator

CorrectnessLevel = Literal["correct", "partially_correct", "incorrect", "unclear"]
CompletenessLevel = Literal["complete", "partial", "incomplete"]
ReasoningQualityLevel = Literal["strong", "adequate", "weak", "unfounded"]
SeverityLevel = Literal["low", "medium", "high"]


class KnowledgeGapItem(BaseModel):
    """Identified student learning gap aligned with README Section 14 (knowledge_gaps table)."""

    model_config = ConfigDict(extra="ignore")

    concept: str = Field(..., min_length=1, description="Concept where a gap was observed.")
    severity: SeverityLevel = Field(
        default="medium",
        description="Severity of the knowledge gap ('low', 'medium', 'high').",
    )
    explanation: str = Field(
        ...,
        min_length=1,
        description="Evidence-based explanation of what the student missed or misunderstood.",
    )
    recommendation: str = Field(
        ...,
        min_length=1,
        description="Actionable study or improvement recommendation for the student.",
    )


class AnswerEvaluateRequest(BaseModel):
    """Request payload for POST /internal/v1/answers/evaluate."""

    model_config = ConfigDict(extra="ignore")

    response_id: Optional[str] = Field(default=None, description="ID of the response record.")
    question_id: Optional[str] = Field(default=None, description="ID of the question being answered.")
    concept: Optional[str] = Field(
        default=None,
        description="Primary concept associated with the question.",
    )
    question: Optional[str] = Field(
        default=None,
        description="The viva question asked to the student.",
    )
    question_text: Optional[str] = Field(
        default=None,
        description="Optional alias for 'question'.",
    )
    expected_concepts: List[str] = Field(
        default_factory=list,
        description="Concepts expected in a complete response.",
    )
    transcription: Optional[str] = Field(
        default=None,
        description="Transcribed student answer text (if already transcribed).",
    )
    audio_base64: Optional[str] = Field(
        default=None,
        description="Base64-encoded student audio recording for speech-to-text transcription.",
    )
    audio_url: Optional[str] = Field(
        default=None,
        description="Signed URL to download student audio recording for transcription.",
    )
    audio_mime_type: str = Field(
        default="audio/webm",
        description="MIME type of the provided audio recording.",
    )
    document_context: Optional[str] = Field(
        default=None,
        description="Relevant context from the student's submitted academic work.",
    )

    @model_validator(mode="before")
    @classmethod
    def normalize_question_field(cls, data: Any) -> Any:
        if isinstance(data, dict):
            q = data.get("question") or data.get("question_text")
            if q and isinstance(q, str):
                data["question"] = q
                data["question_text"] = q
        return data

    @model_validator(mode="after")
    def validate_inputs(self) -> "AnswerEvaluateRequest":
        if not self.question or not self.question.strip():
            raise ValueError("Field 'question' (or 'question_text') is required and must be non-empty.")

        has_text = bool(self.transcription and self.transcription.strip())
        has_audio_b64 = bool(self.audio_base64 and self.audio_base64.strip())
        has_audio_url = bool(self.audio_url and self.audio_url.strip())
        if not (has_text or has_audio_b64 or has_audio_url):
            raise ValueError(
                "At least one student response source must be provided: 'transcription', 'audio_base64', or 'audio_url'."
            )
        return self


class AnswerEvaluateResponse(BaseModel):
    """Response payload for POST /internal/v1/answers/evaluate."""

    model_config = ConfigDict(extra="ignore")

    response_id: Optional[str] = Field(default=None)
    transcription: str = Field(
        ...,
        description="Transcribed text of the student's spoken response.",
    )
    correctness: CorrectnessLevel = Field(
        ...,
        description="Conceptual accuracy classification ('correct', 'partially_correct', 'incorrect', 'unclear').",
    )
    completeness: CompletenessLevel = Field(
        ...,
        description="Completeness classification ('complete', 'partial', 'incomplete').",
    )
    reasoning_quality: ReasoningQualityLevel = Field(
        ...,
        description="Quality of reasoning ('strong', 'adequate', 'weak', 'unfounded').",
    )
    feedback: str = Field(
        ...,
        min_length=1,
        description="Constructive, student-facing diagnostic feedback.",
    )
    explanation: str = Field(
        ...,
        min_length=1,
        description="Detailed evidence-based explanation of the evaluation judgment.",
    )
    supporting_evidence: List[str] = Field(
        default_factory=list,
        description="Direct quotes or observations from the student response supporting the evaluation.",
    )
    demonstrated_concepts: List[str] = Field(
        default_factory=list,
        description="Concepts the student accurately explained or applied.",
    )
    missing_concepts: List[str] = Field(
        default_factory=list,
        description="Expected concepts omitted or insufficiently explained by the student.",
    )
    misconceptions: List[str] = Field(
        default_factory=list,
        description="Specific conceptual misunderstandings detected in the student's answer.",
    )
    knowledge_gaps: List[KnowledgeGapItem] = Field(
        default_factory=list,
        description="Structured knowledge gap entries for persistence in the 'knowledge_gaps' table.",
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Evaluator confidence score in [0.0, 1.0].",
    )
    uncertainty_notes: Optional[str] = Field(
        default=None,
        description="Notes explaining any ambiguity in transcription or interpretation.",
    )
    needs_follow_up: bool = Field(
        default=False,
        description="Whether an adaptive follow-up question is recommended.",
    )
    suggested_follow_up_direction: Optional[str] = Field(
        default=None,
        description="Recommended angle if a follow-up question is generated.",
    )
