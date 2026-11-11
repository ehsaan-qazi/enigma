"""Personalized primary and adaptive follow-up viva question generation pipelines."""

from __future__ import annotations

from typing import Any, Callable, Dict, List, Optional

from app.core.llm import LLMResponseError, call_llm_json
from app.prompts.question_generation import (
    FOLLOW_UP_GENERATION_SYSTEM_PROMPT,
    QUESTION_GENERATION_SYSTEM_PROMPT,
    build_follow_up_user_prompt,
    build_question_generation_user_prompt,
)
from app.schemas.questions import (
    DifficultyLevel,
    FollowUpGenerateRequest,
    FollowUpGenerateResponse,
    GeneratedQuestion,
    QuestionGenerateRequest,
    QuestionGenerateResponse,
    QuestionType,
)

_QUESTION_TEMPLATES = [
    (
        "easy",
        "primary",
        "In your submission, you incorporated {concept}. Can you explain in your own words what {concept} is and why it is relevant to your work?",
        "Assess foundational conceptual understanding and ability to articulate core definitions in context.",
        ["Core definition of {concept}", "Purpose in the submitted work", "Practical relevance"],
    ),
    (
        "medium",
        "justification",
        "Why did you choose your specific approach to {concept} over alternative methods, and what trade-offs did that decision introduce?",
        "Evaluate architectural and technical decision-making and awareness of design trade-offs.",
        ["Design rationale for {concept}", "Comparison with alternatives", "Performance or maintainability trade-offs"],
    ),
    (
        "medium",
        "primary",
        "Walk me through how {concept} interacts with the rest of your implementation. What happens step-by-step during execution?",
        "Verify operational understanding of how the implementation works end-to-end.",
        ["Execution flow of {concept}", "Component interactions", "Data or state handling"],
    ),
    (
        "hard",
        "scenario",
        "Suppose a key assumption or constraint around {concept} changed significantly—such as a 10x increase in scale or stricter consistency requirements. How would your current design break or need to adapt?",
        "Test transfer of knowledge and ability to reason about unfamiliar scenarios and failure modes.",
        ["Bottlenecks or failure modes of {concept}", "Adaptation strategy under new constraints", "Impact on correctness or latency"],
    ),
    (
        "hard",
        "justification",
        "What is the most subtle edge case or potential failure mode in your handling of {concept}, and how does your solution guard against it?",
        "Probe deep understanding of edge cases, invariants, and defensive engineering.",
        ["Edge case identification in {concept}", "Invariant preservation", "Mitigation or recovery mechanism"],
    ),
]


def _normalize_difficulty(
    value: Any,
    allowed: Optional[List[DifficultyLevel]] = None,
    default: DifficultyLevel = "medium",
) -> DifficultyLevel:
    val = str(value or "").strip().lower()
    if val not in ("easy", "medium", "hard"):
        val = default
    diff: DifficultyLevel = val  # type: ignore[assignment]
    if allowed and diff not in allowed:
        return allowed[0]
    return diff


def _normalize_question_type(value: Any, default: QuestionType = "primary") -> QuestionType:
    val = str(value or "").strip().lower()
    if val in ("primary", "follow_up", "clarification", "scenario", "justification"):
        return val  # type: ignore[return-value]
    return default


def _build_deterministic_questions(request: QuestionGenerateRequest) -> QuestionGenerateResponse:
    """Generate personalized, concept-grounded primary questions deterministically."""
    concepts = list(request.concepts)
    if not concepts:
        if request.topics:
            concepts = list(request.topics)
        else:
            concepts = ["Core System Design", "Implementation Methodology", "Data Modeling"]

    allowed_difficulties = request.difficulty_constraints or ["easy", "medium", "hard"]
    questions: List[GeneratedQuestion] = []

    for i in range(request.num_questions):
        concept = concepts[i % len(concepts)]
        tpl_diff, tpl_type, tpl_prompt, tpl_intent, tpl_expected = _QUESTION_TEMPLATES[
            i % len(_QUESTION_TEMPLATES)
        ]
        difficulty = _normalize_difficulty(tpl_diff, allowed_difficulties)
        q_text = tpl_prompt.format(concept=concept)
        expected = [item.format(concept=concept) for item in tpl_expected]
        if len(concepts) > 1:
            related = concepts[(i + 1) % len(concepts)]
            if related != concept:
                expected.append(f"Relationship with {related}")

        questions.append(
            GeneratedQuestion(
                id=f"q{i + 1}",
                concept=concept,
                question=q_text,
                question_text=q_text,
                question_type=_normalize_question_type(tpl_type),
                difficulty=difficulty,
                expected_concepts=expected,
                assessment_intent=tpl_intent,
                sequence_number=i + 1,
            )
        )

    return QuestionGenerateResponse(
        submission_id=request.submission_id,
        questions=questions,
    )


def _coerce_llm_questions(
    llm_data: Dict[str, Any],
    *,
    request: QuestionGenerateRequest,
    fallback: QuestionGenerateResponse,
) -> QuestionGenerateResponse:
    raw_questions = llm_data.get("questions")
    if not isinstance(raw_questions, list) or not raw_questions:
        return fallback

    parsed_questions: List[GeneratedQuestion] = []
    allowed = request.difficulty_constraints

    for idx, item in enumerate(raw_questions[: request.num_questions]):
        if not isinstance(item, dict):
            continue
        fb_q = fallback.questions[idx % len(fallback.questions)]
        q_str = str(item.get("question") or item.get("question_text") or "").strip() or fb_q.question
        concept = str(item.get("concept") or "").strip() or fb_q.concept
        raw_expected = item.get("expected_concepts")
        expected = (
            [str(e).strip() for e in raw_expected if str(e).strip()]
            if isinstance(raw_expected, list)
            else []
        )
        if not expected:
            expected = fb_q.expected_concepts

        parsed_questions.append(
            GeneratedQuestion(
                id=str(item.get("id") or f"q{idx + 1}").strip(),
                concept=concept,
                question=q_str,
                question_text=q_str,
                question_type=_normalize_question_type(item.get("question_type"), fb_q.question_type),
                difficulty=_normalize_difficulty(item.get("difficulty"), allowed, fb_q.difficulty),
                expected_concepts=expected,
                assessment_intent=str(item.get("assessment_intent") or fb_q.assessment_intent).strip(),
                sequence_number=idx + 1,
            )
        )

    if not parsed_questions:
        return fallback

    while len(parsed_questions) < request.num_questions:
        next_idx = len(parsed_questions)
        fb_item = fallback.questions[next_idx % len(fallback.questions)]
        parsed_questions.append(
            fb_item.model_copy(update={"id": f"q{next_idx + 1}", "sequence_number": next_idx + 1})
        )

    return QuestionGenerateResponse(
        submission_id=request.submission_id,
        questions=parsed_questions,
    )


async def generate_questions_pipeline(
    request: QuestionGenerateRequest,
    *,
    llm_completion_fn: Optional[Callable[[str, str], Any]] = None,
    strict_llm: bool = False,
) -> QuestionGenerateResponse:
    """Generate personalized primary viva questions from extracted document concepts."""
    fallback = _build_deterministic_questions(request)
    user_prompt = build_question_generation_user_prompt(
        concepts=request.concepts or [q.concept for q in fallback.questions],
        topics=request.topics,
        num_questions=request.num_questions,
        document_summary=request.document_summary,
        document_context=request.document_context,
        difficulty_constraints=list(request.difficulty_constraints) if request.difficulty_constraints else None,
        assessment_objectives=request.assessment_objectives,
    )

    try:
        llm_data = await call_llm_json(
            system_prompt=QUESTION_GENERATION_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.3,
            llm_completion_fn=llm_completion_fn,
        )
    except LLMResponseError:
        if strict_llm:
            raise
        return fallback

    if not llm_data:
        return fallback

    return _coerce_llm_questions(llm_data, request=request, fallback=fallback)


def _build_deterministic_follow_up(request: FollowUpGenerateRequest) -> FollowUpGenerateResponse:
    """Construct an adaptive follow-up question conditioned on prior evaluation results."""
    eval_data = request.evaluation_result or {}
    raw_correctness = eval_data.get("correctness_label") or eval_data.get("correctness")
    raw_completeness = eval_data.get("completeness_label") or eval_data.get("completeness")
    misconceptions = (
        eval_data.get("misconceptions")
        or eval_data.get("potential_misconceptions")
        or []
    )
    missing = eval_data.get("missing_concepts") or []

    # Normalize numeric correctness (0-100) or categorical string
    is_strong = False
    is_partial = False
    if isinstance(raw_correctness, (int, float)):
        if raw_correctness >= 80 and (
            not isinstance(raw_completeness, (int, float)) or raw_completeness >= 80
        ):
            is_strong = True
        elif raw_correctness >= 50:
            is_partial = True
    elif isinstance(raw_correctness, str):
        if raw_correctness == "correct" and raw_completeness in ("complete", None):
            is_strong = True
        elif raw_correctness == "partially_correct":
            is_partial = True

    concept = request.concept or "Core Concept"

    if misconceptions and isinstance(misconceptions, list):
        misc_str = str(misconceptions[0])
        follow_up_q = (
            f"You mentioned a point related to {concept} ({misc_str}). "
            f"If we trace how {concept} actually operates in your implementation, "
            "what happens step-by-step and how does that affect your earlier claim?"
        )
        reason = f"Investigate and resolve the detected misconception: {misc_str}"
        target_concept = concept
        difficulty: DifficultyLevel = "medium"
        objective = f"Probe misconception regarding {concept}"
        q_type: QuestionType = "follow_up"
        expected = list(missing) if missing else (request.expected_concepts or [f"Accurate mechanism of {concept}"])
    elif is_partial or (missing and isinstance(missing, list)):
        missing_target = str(missing[0]) if missing else concept
        follow_up_q = (
            f"Building on your explanation of {concept}, how specifically does your design address "
            f"'{missing_target}', and why is it necessary in this context?"
        )
        reason = f"Student gave a partial explanation and omitted '{missing_target}'."
        target_concept = missing_target
        difficulty = request.current_difficulty
        objective = f"Clarify missing expected concept '{missing_target}'"
        q_type = "clarification"
        expected = [str(m) for m in missing[:3]] if missing else [missing_target, f"Connection to {concept}"]
    elif is_strong:
        follow_up_q = (
            f"Your explanation of {concept} was clear. Now consider an unfamiliar scenario: "
            f"if traffic or concurrency around {concept} increased by 10x while strict consistency was required, "
            "what bottleneck or anomaly would appear first in your design and how would you mitigate it?"
        )
        reason = (
            f"Student demonstrated strong mastery of {concept}; escalating to an unfamiliar transfer scenario."
        )
        target_concept = f"{concept} under scale/stress"
        difficulty = "hard"
        objective = f"Test transfer of knowledge for {concept} in an unfamiliar high-stress scenario"
        q_type = "scenario"
        expected = [
            f"Failure mode or bottleneck of {concept} under load",
            "Concrete mitigation strategy",
            "Consistency vs. latency trade-off",
        ]
    else:
        follow_up_q = (
            f"Let's break {concept} down more concretely: in your submitted project, "
            f"where did you apply {concept} and what specific problem was it solving?"
        )
        reason = f"Previous response was unclear or incomplete; scaffolding foundational understanding of {concept}."
        target_concept = concept
        difficulty = "easy"
        objective = f"Verify foundational understanding of {concept} in the student's work"
        q_type = "clarification"
        expected = request.expected_concepts or [
            f"Core purpose of {concept}",
            f"Concrete usage of {concept} in the submission",
        ]

    gen_q = GeneratedQuestion(
        id=f"q-followup-{request.sequence_number}",
        concept=target_concept,
        question=follow_up_q,
        question_text=follow_up_q,
        question_type=q_type,
        difficulty=difficulty,
        expected_concepts=expected,
        assessment_intent=objective,
        sequence_number=request.sequence_number,
    )

    return FollowUpGenerateResponse(
        should_ask_follow_up=True,
        question=follow_up_q,
        follow_up_question=follow_up_q,
        concept=target_concept,
        concept_investigated=target_concept,
        difficulty=difficulty,
        reason_for_asking=reason,
        assessment_objective=objective,
        expected_concepts=expected,
        generated_question=gen_q,
    )


def _coerce_llm_follow_up(
    llm_data: Dict[str, Any],
    *,
    request: FollowUpGenerateRequest,
    fallback: FollowUpGenerateResponse,
) -> FollowUpGenerateResponse:
    q_str = (
        str(llm_data.get("follow_up_question") or llm_data.get("question") or "").strip()
        or fallback.follow_up_question
    )
    reason = str(llm_data.get("reason_for_asking") or "").strip() or fallback.reason_for_asking
    concept_inv = (
        str(llm_data.get("concept_investigated") or llm_data.get("concept") or "").strip()
        or fallback.concept_investigated
    )
    difficulty = _normalize_difficulty(llm_data.get("difficulty"), None, fallback.difficulty)
    objective = (
        str(llm_data.get("assessment_objective") or "").strip() or fallback.assessment_objective
    )
    raw_expected = llm_data.get("expected_concepts")
    expected = (
        [str(e).strip() for e in raw_expected if str(e).strip()]
        if isinstance(raw_expected, list)
        else []
    )
    if not expected:
        expected = fallback.expected_concepts

    should_ask = llm_data.get("should_ask_follow_up")
    if not isinstance(should_ask, bool):
        should_ask = True

    gen_q = GeneratedQuestion(
        id=f"q-followup-{request.sequence_number}",
        concept=concept_inv,
        question=q_str,
        question_text=q_str,
        question_type="follow_up",
        difficulty=difficulty,
        expected_concepts=expected,
        assessment_intent=objective,
        sequence_number=request.sequence_number,
    )

    return FollowUpGenerateResponse(
        should_ask_follow_up=should_ask,
        question=q_str,
        follow_up_question=q_str,
        concept=concept_inv,
        concept_investigated=concept_inv,
        difficulty=difficulty,
        reason_for_asking=reason,
        assessment_objective=objective,
        expected_concepts=expected,
        generated_question=gen_q,
    )


async def generate_follow_up_pipeline(
    request: FollowUpGenerateRequest,
    *,
    llm_completion_fn: Optional[Callable[[str, str], Any]] = None,
    strict_llm: bool = False,
) -> FollowUpGenerateResponse:
    """Generate an adaptive follow-up question based on student response and evaluation."""
    fallback = _build_deterministic_follow_up(request)
    user_prompt = build_follow_up_user_prompt(
        original_question=request.original_question,
        concept=request.concept,
        student_response=request.student_response,
        expected_concepts=request.expected_concepts,
        evaluation_result=request.evaluation_result,
        current_difficulty=request.current_difficulty,
        assessment_context=request.assessment_context,
    )

    try:
        llm_data = await call_llm_json(
            system_prompt=FOLLOW_UP_GENERATION_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.3,
            llm_completion_fn=llm_completion_fn,
        )
    except LLMResponseError:
        if strict_llm:
            raise
        return fallback

    if not llm_data:
        return fallback

    return _coerce_llm_follow_up(llm_data, request=request, fallback=fallback)
