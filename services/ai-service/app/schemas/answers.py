"""Pydantic v2 schemas for speech-to-text transcription, evidence-based answer evaluation, and report synthesis."""

from __future__ import annotations

from typing import Any, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator

CorrectnessLevel = Literal["correct", "partially_correct", "incorrect", "unclear"]
CompletenessLevel = Literal["complete", "partial", "incomplete"]
ReasoningQualityLevel = Literal["strong", "adequate", "weak", "unfounded"]
SeverityLevel = Literal["low", "medium", "high"]
UnderstandingLevel = Literal["High", "Moderate", "Needs Improvement"]


class TranscriptionRequest(BaseModel):
    """Request payload for POST /internal/v1/transcribe."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    audio_storage_path: Optional[str] = Field(default=None)
    audio_url: Optional[str] = Field(default=None)
    audio_base64: Optional[str] = Field(default=None)
    audio_mime_type: str = Field(default="audio/webm")

    @model_validator(mode="before")
    @classmethod
    def normalize_camel_case(cls, data: Any) -> Any:
        if isinstance(data, dict):
            out = dict(data)
            if "audioStoragePath" in out and not out.get("audio_storage_path"):
                out["audio_storage_path"] = out["audioStoragePath"]
            if "audioUrl" in out and not out.get("audio_url"):
                out["audio_url"] = out["audioUrl"]
            if "audioBase64" in out and not out.get("audio_base64"):
                out["audio_base64"] = out["audioBase64"]
            return out
        return data

    @model_validator(mode="after")
    def validate_audio_source(self) -> "TranscriptionRequest":
        if not (
            (self.audio_storage_path and self.audio_storage_path.strip())
            or (self.audio_url and self.audio_url.strip())
            or (self.audio_base64 and self.audio_base64.strip())
        ):
            raise ValueError(
                "Provide at least one audio source: 'audio_storage_path' ('audioStoragePath'), 'audio_url' ('audioUrl'), or 'audio_base64'."
            )
        return self


class TranscriptionResponse(BaseModel):
    """Response payload for POST /internal/v1/transcribe."""

    model_config = ConfigDict(extra="ignore")

    transcription: str = Field(..., min_length=1)


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
    """Request payload for POST /internal/v1/answers/evaluate.

    Supports both snake_case and Next.js BFF camelCase (`vivaId`, `questionId`, `questionText`, `expectedConcepts`, `audioStoragePath`).
    """

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    viva_id: Optional[str] = Field(default=None, description="ID of the viva session.")
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
    audio_storage_path: Optional[str] = Field(
        default=None,
        description="Supabase Storage path for the student audio recording.",
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
    def normalize_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            out = dict(data)
            if "vivaId" in out and not out.get("viva_id"):
                out["viva_id"] = out["vivaId"]
            if "questionId" in out and not out.get("question_id"):
                out["question_id"] = out["questionId"]
            if "responseId" in out and not out.get("response_id"):
                out["response_id"] = out["responseId"]
            if "expectedConcepts" in out and not out.get("expected_concepts"):
                out["expected_concepts"] = out["expectedConcepts"]
            if "audioStoragePath" in out and not out.get("audio_storage_path"):
                out["audio_storage_path"] = out["audioStoragePath"]
            if "audioUrl" in out and not out.get("audio_url"):
                out["audio_url"] = out["audioUrl"]
            if "audioBase64" in out and not out.get("audio_base64"):
                out["audio_base64"] = out["audioBase64"]

            q = out.get("question") or out.get("question_text") or out.get("questionText")
            if q and isinstance(q, str):
                out["question"] = q
                out["question_text"] = q
            return out
        return data

    @model_validator(mode="after")
    def validate_inputs(self) -> "AnswerEvaluateRequest":
        if not self.question or not self.question.strip():
            raise ValueError(
                "Field 'question' (or 'question_text' / 'questionText') is required and must be non-empty."
            )

        has_text = bool(self.transcription and self.transcription.strip())
        has_audio_b64 = bool(self.audio_base64 and self.audio_base64.strip())
        has_audio_url = bool(self.audio_url and self.audio_url.strip())
        has_audio_path = bool(self.audio_storage_path and self.audio_storage_path.strip())
        if not (has_text or has_audio_b64 or has_audio_url or has_audio_path):
            raise ValueError(
                "At least one student response source must be provided: 'transcription', "
                "'audio_base64', 'audio_url', or 'audio_storage_path' ('audioStoragePath')."
            )
        return self


class AnswerEvaluateResponse(BaseModel):
    """Response payload for POST /internal/v1/answers/evaluate.

    Aligned with Qazi's REQ-D1 & PostgreSQL `evaluations` table (numeric 0-100 scores for
    `correctness`, `completeness`, `reasoning_quality`, plus categorical labels and
    both `misconceptions` and `potential_misconceptions`).
    """

    model_config = ConfigDict(extra="ignore")

    response_id: Optional[str] = Field(default=None)
    transcription: str = Field(
        ...,
        description="Transcribed text of the student's spoken response.",
    )
    correctness: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Conceptual accuracy score in [0, 100] (PostgreSQL evaluations.correctness).",
    )
    completeness: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Completeness score in [0, 100] (PostgreSQL evaluations.completeness).",
    )
    reasoning_quality: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Reasoning quality score in [0, 100] (PostgreSQL evaluations.reasoning_quality).",
    )
    correctness_label: CorrectnessLevel = Field(
        default="correct",
        description="Categorical accuracy label ('correct', 'partially_correct', 'incorrect', 'unclear').",
    )
    completeness_label: CompletenessLevel = Field(
        default="complete",
        description="Categorical completeness label ('complete', 'partial', 'incomplete').",
    )
    reasoning_quality_label: ReasoningQualityLevel = Field(
        default="adequate",
        description="Categorical reasoning label ('strong', 'adequate', 'weak', 'unfounded').",
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
    potential_misconceptions: List[str] = Field(
        default_factory=list,
        description="Alias for 'misconceptions' matching Next.js BFF AnswerEvaluateResult (REQ-D1).",
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

    @model_validator(mode="after")
    def sync_misconceptions(self) -> "AnswerEvaluateResponse":
        if self.misconceptions and not self.potential_misconceptions:
            self.potential_misconceptions = list(self.misconceptions)
        elif self.potential_misconceptions and not self.misconceptions:
            self.misconceptions = list(self.potential_misconceptions)
        return self


class ReportEvaluationInput(BaseModel):
    """Single question-response evaluation item for session-level report synthesis."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    question: str = Field(default="Viva Question")
    concept: str = Field(default="Core Concept")
    transcription: str = Field(default="")
    correctness: float = Field(default=75.0, ge=0.0, le=100.0)
    completeness: float = Field(default=75.0, ge=0.0, le=100.0)
    reasoning_quality: float = Field(default=75.0, ge=0.0, le=100.0)
    feedback: str = Field(default="")
    demonstrated_concepts: List[str] = Field(default_factory=list)
    missing_concepts: List[str] = Field(default_factory=list)
    misconceptions: List[str] = Field(default_factory=list)
    supporting_evidence: List[str] = Field(default_factory=list)
    confidence: float = Field(default=0.85, ge=0.0, le=1.0)


class ReportSynthesisRequest(BaseModel):
    """Request payload for POST /internal/v1/answers/synthesize-report (and /internal/v1/reports/synthesize)."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    viva_id: Optional[str] = Field(default=None)
    submission_title: Optional[str] = Field(default=None)
    evaluations: List[ReportEvaluationInput] = Field(..., min_length=1)

    @model_validator(mode="before")
    @classmethod
    def normalize_camel_case(cls, data: Any) -> Any:
        if isinstance(data, dict):
            out = dict(data)
            if "vivaId" in out and not out.get("viva_id"):
                out["viva_id"] = out["vivaId"]
            if "submissionTitle" in out and not out.get("submission_title"):
                out["submission_title"] = out["submissionTitle"]
            return out
        return data


class ReportSynthesisResponse(BaseModel):
    """Synthesized final assessment report aligned with README Section 4.6, 5.6, and 25 Phase 6."""

    model_config = ConfigDict(extra="ignore")

    viva_id: Optional[str] = Field(default=None)
    overall_summary: str = Field(..., min_length=1)
    overall_understanding_level: UnderstandingLevel = Field(default="Moderate")
    demonstrated_concepts: List[str] = Field(default_factory=list)
    partially_understood_concepts: List[str] = Field(default_factory=list)
    missing_concepts: List[str] = Field(default_factory=list)
    misconceptions: List[str] = Field(default_factory=list)
    knowledge_gaps: List[KnowledgeGapItem] = Field(default_factory=list)
    supporting_evidence: List[str] = Field(default_factory=list)
    improvement_recommendations: List[str] = Field(default_factory=list)
    average_correctness: float = Field(..., ge=0.0, le=100.0)
    average_completeness: float = Field(..., ge=0.0, le=100.0)
    average_reasoning_quality: float = Field(..., ge=0.0, le=100.0)
    average_confidence: float = Field(..., ge=0.0, le=1.0)
    assessment_disclaimer: str = Field(
        default=(
            "This assessment reflects conceptual understanding demonstrated during this viva session "
            "and is intended as diagnostic learning feedback rather than a definitive measurement of academic ability."
        )
    )
