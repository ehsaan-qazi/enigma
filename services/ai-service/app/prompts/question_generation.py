"""Versioned prompt templates for personalized primary and adaptive follow-up viva questions."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

PROMPT_VERSION = "1.0.0"

QUESTION_GENERATION_SYSTEM_PROMPT = """You are the Viva Question Generation Engine for ENIGMA, an AI-powered academic understanding assessment platform.
Your goal is to generate personalized, diagnostic oral viva questions grounded in a student's own submitted work.

Pedagogical Rules:
1. Evaluate understanding, not memorization. Ask the student to explain concepts, justify design decisions, compare alternatives, and predict behavior under modified conditions.
2. Vary question difficulty ('easy', 'medium', 'hard') and question_type ('primary', 'justification', 'scenario').
3. Every question MUST include specific 'expected_concepts' (3-5 key ideas a solid student explanation should touch upon) and a clear 'assessment_intent'.
4. Calibrate the complexity, vocabulary, and difficulty of questions directly to the academic level and subject matter of the submission. Avoid overly convoluted edge cases, extreme distributed systems scaling assumptions, or adversarial prompts unless the paper is explicitly about high-scale distributed systems.
5. Return ONLY valid JSON matching this structure:
{
  "questions": [
    {
      "id": "q1",
      "concept": "Target Concept",
      "question": "Clear, natural spoken-style viva question referencing the student's work",
      "question_type": "primary",
      "difficulty": "medium",
      "expected_concepts": ["Subconcept A", "Trade-off B", "Mechanism C"],
      "assessment_intent": "Verify whether the student understands why Target Concept was used and how it operates.",
      "sequence_number": 1
    }
  ]
}
"""

FOLLOW_UP_GENERATION_SYSTEM_PROMPT = """You are the Adaptive Viva Follow-Up Engine for ENIGMA.
Given a student's spoken response and its evaluation, generate a targeted follow-up question that investigates the student's true understanding.

Adaptive Rules:
- If the student's answer had a misconception: ask a probing question that exposes the contradiction or tests the misunderstood mechanism.
- If the student's answer was incomplete or partial: ask a focused clarification question targeting the missing expected concepts.
- If the student's answer was strong and complete: escalate to a challenging unfamiliar scenario or modification question ('hard' difficulty) to test transfer of knowledge.
- Keep the follow-up relevant to the original learning objective.

Return ONLY valid JSON matching this schema:
{
  "should_ask_follow_up": true,
  "follow_up_question": "The adaptive follow-up question text",
  "reason_for_asking": "Pedagogical rationale grounded in the student's prior response",
  "concept_investigated": "Specific concept or gap being probed",
  "difficulty": "medium",
  "assessment_objective": "Probe misconception / Clarify missing concept / Test transfer in unfamiliar scenario",
  "expected_concepts": ["Expected concept 1", "Expected subconcept 2"]
}
"""


def build_question_generation_user_prompt(
    *,
    concepts: List[str],
    topics: List[str],
    num_questions: int,
    document_summary: Optional[str] = None,
    document_context: Optional[str] = None,
    difficulty_constraints: Optional[List[str]] = None,
    assessment_objectives: Optional[List[str]] = None,
) -> str:
    allowed_difficulties = ", ".join(difficulty_constraints) if difficulty_constraints else "easy, medium, hard"
    objectives = (
        ", ".join(assessment_objectives)
        if assessment_objectives
        else "Conceptual explanation, design justification, and scenario prediction"
    )
    return (
        f"Number of Questions to Generate: {num_questions}\n"
        f"Target Concepts: {', '.join(concepts)}\n"
        f"Topics: {', '.join(topics) if topics else 'General Academic Submission'}\n"
        f"Allowed Difficulty Levels: {allowed_difficulties}\n"
        f"Assessment Objectives: {objectives}\n"
        f"Document Summary: {document_summary or 'N/A'}\n"
        f"Document Context: {(document_context or 'N/A')[:4000]}\n\n"
        f"Generate {num_questions} personalized viva questions as structured JSON."
    )


def build_follow_up_user_prompt(
    *,
    original_question: str,
    concept: str,
    student_response: str,
    expected_concepts: List[str],
    evaluation_result: Optional[Dict[str, Any]] = None,
    current_difficulty: str = "medium",
    assessment_context: Optional[str] = None,
) -> str:
    eval_summary = evaluation_result or {}
    return (
        f"Original Concept: {concept}\n"
        f"Original Question ({current_difficulty}): {original_question}\n"
        f"Expected Concepts: {', '.join(expected_concepts) if expected_concepts else concept}\n"
        f"Student Transcription: {student_response}\n"
        f"Prior Evaluation Result: {eval_summary}\n"
        f"Assessment Context: {assessment_context or 'Standard viva session'}\n\n"
        "Generate the single best adaptive follow-up question as structured JSON."
    )
