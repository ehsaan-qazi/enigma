"""Versioned prompt templates for personalized primary and adaptive follow-up viva questions."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

PROMPT_VERSION = "1.0.0"

QUESTION_GENERATION_SYSTEM_PROMPT = """You are the Viva Question Generation Engine for ENIGMA, an AI-powered academic understanding assessment platform.
Your goal is to generate personalized, diagnostic oral viva questions strictly grounded in the student's own submitted assignment and solutions.

Pedagogical & Relevance Rules:
1. STRICT GROUNDING: Every question MUST directly reference specific tasks, questions, code, calculations, algorithms, or problem solutions found in the student's uploaded submission in the Document Context.
2. If the document has specific assignment tasks (e.g. "Question 1", "Task 2", "Exercise 3", "Problem 4", or specific functions/classes implemented by the student), formulate your questions directly referencing those specific tasks and the student's work on them:
   - "In Question 1 where you calculated/implemented [X], can you explain your reasoning and walk through how your solution works step-by-step?"
   - "Looking at your implementation in Task 2, what trade-offs did you consider when designing [specific mechanism]?"
3. NEVER ask generic textbook trivia or disconnected "What is Core Methodology" or generic systems questions if the assignment is about something else (e.g. assembly, web development, data structures, math, physics).
4. Evaluate understanding, not memorization. Ask the student to justify their specific design choices, explain step-by-step how their solution works, and predict behavior under modified constraints.
5. Vary question difficulty ('easy', 'medium', 'hard') and question_type ('primary', 'justification', 'scenario').
6. Every question MUST include specific 'expected_concepts' (3-5 key concepts from the student's work) and a clear 'assessment_intent'.
7. Return ONLY valid JSON matching this structure:
{
  "questions": [
    {
      "id": "q1",
      "concept": "Specific Assignment Problem or Concept",
      "question": "Clear, natural spoken-style viva question directly referencing the student's work on this task",
      "question_type": "primary",
      "difficulty": "medium",
      "expected_concepts": ["Specific Step 1", "Specific Rationale 2", "Mechanism 3"],
      "assessment_intent": "Verify whether the student genuinely solved this task and understands their implementation.",
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
    assignment_tasks: Optional[List[str]] = None,
    difficulty_constraints: Optional[List[str]] = None,
    assessment_objectives: Optional[List[str]] = None,
) -> str:
    allowed_difficulties = ", ".join(difficulty_constraints) if difficulty_constraints else "easy, medium, hard"
    tasks_text = "\n".join(f"- {t}" for t in assignment_tasks) if assignment_tasks else "None explicitly labeled"
    context = (document_context or "").strip()
    if not context and document_summary:
        context = f"Document Summary: {document_summary}"
    if not context:
        context = f"Concepts: {', '.join(concepts)}"

    return (
        f"Number of Questions to Generate: {num_questions}\n"
        f"Allowed Difficulty Levels: {allowed_difficulties}\n"
        f"Target Concepts: {', '.join(concepts)}\n"
        f"Document Summary: {document_summary or 'N/A'}\n"
        f"Identified Assignment Tasks:\n{tasks_text}\n\n"
        f"=== STUDENT'S UPLOADED ASSIGNMENT CONTENT ===\n"
        f"{context[:12000]}\n"
        f"=== END OF ASSIGNMENT CONTENT ===\n\n"
        f"INSTRUCTION: Generate {num_questions} oral viva questions that are strictly and directly derived from the student's assignment text above. If the student answered specific questions, exercises, or wrote specific code, question them directly on those exact problems and their steps. Return valid JSON."
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
