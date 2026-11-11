"""Pydantic v2 schemas for primary and adaptive follow-up question generation."""

from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator

DifficultyLevel = Literal["easy", "medium", "hard"]
QuestionType = Literal[
    "primary",
    "follow_up",
    "clarification",
    "scenario",
    "justification",
]


class GeneratedQuestion(BaseModel):
    """A single structured viva question aligned with README Section 14 & 15.4."""

    model_config = ConfigDict(extra="ignore")

    id: str = Field(..., min_length=1, description="Question identifier (e.g. 'q1').")
    concept: str = Field(..., min_length=1, description="Target concept being assessed.")
    question: str = Field(..., min_length=1, description="The viva question prompt.")
    question_text: str = Field(
        default="",
        description="Alias matching the PostgreSQL 'questions.question_text' column.",
    )
    question_type: QuestionType = Field(
        default="primary",
        description="Category/purpose of the question.",
    )
    difficulty: DifficultyLevel = Field(
        default="medium",
        description="Difficulty classification ('easy', 'medium', 'hard').",
    )
    expected_concepts: List[str] = Field(
        default_factory=list,
        min_length=1,
        description="Key concepts expected in a strong student explanation.",
    )
    assessment_intent: str = Field(
        default="Evaluate conceptual understanding and reasoning.",
        description="Why this question is asked and what understanding it tests.",
    )
    sequence_number: int = Field(
        default=1,
        ge=1,
        description="Order of the question within the viva session.",
    )

    @model_validator(mode="after")
    def sync_question_text(self) -> "GeneratedQuestion":
        if not self.question_text:
            self.question_text = self.question
        elif not self.question:
            self.question = self.question_text
        return self


class QuestionGenerateRequest(BaseModel):
    """Request payload for POST /internal/v1/questions/generate."""

    model_config = ConfigDict(extra="ignore")

    submission_id: Optional[str] = Field(default=None)
    concepts: List[str] = Field(
        default_factory=list,
        description="Extracted concepts from document analysis.",
    )
    topics: List[str] = Field(
        default_factory=list,
        description="High-level topics from document analysis.",
    )
    document_summary: Optional[str] = Field(
        default=None,
        description="Summary of the student's submitted document.",
    )
    document_context: Optional[str] = Field(
        default=None,
        description="Relevant excerpts or text from the student's submission.",
    )
    num_questions: int = Field(
        default=5,
        ge=1,
        le=15,
        description="Number of primary viva questions to generate.",
    )
    difficulty_constraints: Optional[List[DifficultyLevel]] = Field(
        default=None,
        description="Allowed or desired difficulty levels.",
    )
    assessment_objectives: Optional[List[str]] = Field(
        default=None,
        description="Specific learning or assessment objectives to prioritize.",
    )

    @model_validator(mode="after")
    def validate_inputs(self) -> "QuestionGenerateRequest":
        clean_concepts = [c.strip() for c in self.concepts if c and c.strip()]
        self.concepts = clean_concepts
        has_context = bool(
            (self.document_context and self.document_context.strip())
            or (self.document_summary and self.document_summary.strip())
        )
        if not self.concepts and not has_context:
            raise ValueError(
                "Provide at least one concept in 'concepts' or non-empty 'document_context'/'document_summary'."
            )
        return self


class QuestionGenerateResponse(BaseModel):
    """Response payload for POST /internal/v1/questions/generate."""

    model_config = ConfigDict(extra="ignore")

    submission_id: Optional[str] = Field(default=None)
    questions: List[GeneratedQuestion] = Field(
        ...,
        min_length=1,
        description="Generated primary viva questions.",
    )


class FollowUpGenerateRequest(BaseModel):
    """Request payload for POST /internal/v1/questions/follow-up."""

    model_config = ConfigDict(extra="ignore")

    viva_id: Optional[str] = Field(default=None)
    original_question: str = Field(
        ...,
        min_length=1,
        description="The previous question asked to the student.",
    )
    concept: str = Field(
        default="Core Concept",
        min_length=1,
        description="Concept associated with the original question.",
    )
    student_response: str = Field(
        ...,
        min_length=1,
        description="Transcribed student answer to the original question.",
    )
    expected_concepts: List[str] = Field(
        default_factory=list,
        description="Expected concepts for the original question.",
    )
    evaluation_result: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Evaluation output from /internal/v1/answers/evaluate.",
    )
    current_difficulty: DifficultyLevel = Field(
        default="medium",
        description="Difficulty of the original question.",
    )
    assessment_context: Optional[str] = Field(
        default=None,
        description="Additional submission or session context.",
    )
    sequence_number: int = Field(
        default=2,
        ge=1,
        description="Sequence number for the generated follow-up question.",
    )


class FollowUpGenerateResponse(BaseModel):
    """Response payload for POST /internal/v1/questions/follow-up."""

    model_config = ConfigDict(extra="ignore")

    should_ask_follow_up: bool = Field(
        default=True,
        description="Whether a follow-up question is warranted.",
    )
    follow_up_question: str = Field(
        ...,
        min_length=1,
        description="The adaptive follow-up question text.",
    )
    reason_for_asking: str = Field(
        ...,
        min_length=1,
        description="Pedagogical reason for asking this follow-up (e.g., probing a misconception or testing transfer).",
    )
    concept_investigated: str = Field(
        ...,
        min_length=1,
        description="Specific concept or sub-concept being investigated.",
    )
    difficulty: DifficultyLevel = Field(
        default="medium",
        description="Difficulty level of the follow-up question.",
    )
    assessment_objective: str = Field(
        ...,
        min_length=1,
        description="Objective of the follow-up (clarification, misconception probe, or scenario application).",
    )
    expected_concepts: List[str] = Field(
        default_factory=list,
        min_length=1,
        description="Concepts expected in the student's follow-up response.",
    )
    question: GeneratedQuestion = Field(
        ...,
        description="Full GeneratedQuestion structure ready for database persistence.",
    )
