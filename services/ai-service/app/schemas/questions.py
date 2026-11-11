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
    """Request payload for POST /internal/v1/questions/generate.

    Supports both snake_case and Next.js BFF camelCase (`submissionId`, `count`, `difficulty`).
    """

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

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
    document_title: Optional[str] = Field(
        default=None,
        description="Title of the student's submitted paper or assignment.",
    )
    assignment_tasks: List[str] = Field(
        default_factory=list,
        description="Specific tasks, problems, or questions from the assignment.",
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

    @model_validator(mode="before")
    @classmethod
    def normalize_camel_case(cls, data: Any) -> Any:
        if isinstance(data, dict):
            out = dict(data)
            if "submissionId" in out and not out.get("submission_id"):
                out["submission_id"] = out["submissionId"]
            if "count" in out and "num_questions" not in out and out["count"] is not None:
                out["num_questions"] = out["count"]
            if (
                "difficulty" in out
                and "difficulty_constraints" not in out
                and out["difficulty"] in ("easy", "medium", "hard")
            ):
                out["difficulty_constraints"] = [out["difficulty"]]
            if "documentContent" in out and not out.get("document_context"):
                out["document_context"] = out["documentContent"]
            if "extractedContent" in out and not out.get("document_context"):
                out["document_context"] = out["extractedContent"]
            if "extractedText" in out and not out.get("document_context"):
                out["document_context"] = out["extractedText"]
            if "extracted_text" in out and not out.get("document_context"):
                out["document_context"] = out["extracted_text"]
            if "content" in out and not out.get("document_context"):
                out["document_context"] = out["content"]
            if "documentTitle" in out and not out.get("document_title"):
                out["document_title"] = out["documentTitle"]
            if "title" in out and not out.get("document_title"):
                out["document_title"] = out["title"]
            if "summary" in out and not out.get("document_summary"):
                out["document_summary"] = out["summary"]
            if "assignmentTasks" in out and not out.get("assignment_tasks"):
                out["assignment_tasks"] = out["assignmentTasks"]
            return out
        return data

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
    """Request payload for POST /internal/v1/questions/follow-up.

    Accepts both snake_case (`original_question`, `student_response`, `evaluation_result`)
    and Next.js BFF camelCase (`vivaId`, `questionText`, `transcription`, `evaluation`).
    """

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

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

    @model_validator(mode="before")
    @classmethod
    def normalize_camel_case(cls, data: Any) -> Any:
        if isinstance(data, dict):
            out = dict(data)
            if "vivaId" in out and not out.get("viva_id"):
                out["viva_id"] = out["vivaId"]
            if "questionText" in out and not out.get("original_question"):
                out["original_question"] = out["questionText"]
            if "question" in out and not out.get("original_question"):
                out["original_question"] = out["question"]
            if "transcription" in out and not out.get("student_response"):
                out["student_response"] = out["transcription"]
            if "evaluation" in out and not out.get("evaluation_result"):
                out["evaluation_result"] = out["evaluation"]
            if "expectedConcepts" in out and not out.get("expected_concepts"):
                out["expected_concepts"] = out["expectedConcepts"]
            return out
        return data


class FollowUpGenerateResponse(BaseModel):
    """Response payload for POST /internal/v1/questions/follow-up.

    Includes `question` (string) and `concept` (string) directly for `lib/api/ai-client.ts`,
    as well as `follow_up_question` and `generated_question` (GeneratedQuestion object).
    """

    model_config = ConfigDict(extra="ignore")

    should_ask_follow_up: bool = Field(
        default=True,
        description="Whether a follow-up question is warranted.",
    )
    question: str = Field(
        ...,
        min_length=1,
        description="The adaptive follow-up question text (matches BFF FollowUpGenerateResult.question).",
    )
    follow_up_question: str = Field(
        ...,
        min_length=1,
        description="Alias for 'question' containing the adaptive follow-up prompt.",
    )
    concept: str = Field(
        ...,
        min_length=1,
        description="Concept being investigated (matches BFF FollowUpGenerateResult.concept).",
    )
    concept_investigated: str = Field(
        ...,
        min_length=1,
        description="Specific concept or sub-concept being investigated.",
    )
    difficulty: DifficultyLevel = Field(
        default="medium",
        description="Difficulty level of the follow-up question ('easy', 'medium', 'hard').",
    )
    reason_for_asking: str = Field(
        ...,
        min_length=1,
        description="Pedagogical reason for asking this follow-up.",
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
    generated_question: GeneratedQuestion = Field(
        ...,
        description="Full GeneratedQuestion structure ready for database persistence.",
    )
