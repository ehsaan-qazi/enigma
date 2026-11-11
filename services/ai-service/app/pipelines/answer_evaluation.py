"""Evidence-based answer evaluation and misconception detection pipeline."""

from __future__ import annotations

import re
from typing import Any, Callable, Dict, List, Optional

from app.core.llm import LLMResponseError, call_llm_json
from app.pipelines.transcription import resolve_transcription
from app.prompts.answer_evaluation import (
    ANSWER_EVALUATION_SYSTEM_PROMPT,
    build_answer_evaluation_user_prompt,
)
from app.schemas.answers import (
    AnswerEvaluateRequest,
    AnswerEvaluateResponse,
    CompletenessLevel,
    CorrectnessLevel,
    KnowledgeGapItem,
    ReasoningQualityLevel,
)

_UNCERTAINTY_MARKERS = [
    "i don't know",
    "i do not know",
    "not sure",
    "no idea",
    "i forgot",
    "maybe just",
    "i guess",
]

_MISCONCEPTION_PATTERNS = [
    (
        r"\bnormalization\b.*\b(increases|adds|maximizes)\s+redundancy\b",
        "Believes database normalization increases data redundancy rather than minimizing it.",
    ),
    (
        r"\bforeign\s+key\b.*\bencrypt",
        "Confuses relational foreign key constraints with cryptographic encryption.",
    ),
    (
        r"\bindex(es|ing)?\b.*\b(always\s+faster\s+writes|speeds\s+up\s+every\s+insert)\b",
        "Assumes database indexes accelerate write/insert operations without write-amplification overhead.",
    ),
    (
        r"\b(client|browser|frontend)\b.*\bservice[_\s-]role\s+key\b",
        "Suggests exposing privileged Supabase service_role credentials in browser/client code.",
    ),
]

_REASONING_CONNECTIVES = [
    "because",
    "therefore",
    "since",
    "consequently",
    "trade-off",
    "tradeoff",
    "ensures",
    "prevents",
    "reduces",
    "allows",
    "for example",
    "specifically",
    "in order to",
]


def _concept_tokens(concept_phrase: str) -> List[str]:
    return [
        tok
        for tok in re.findall(r"[a-zA-Z0-9]+", concept_phrase.lower())
        if len(tok) > 2 and tok not in {"the", "and", "for", "with", "into", "from"}
    ]


def _heuristic_evaluate_answer(
    *,
    request: AnswerEvaluateRequest,
    transcription: str,
) -> AnswerEvaluateResponse:
    """Deterministic, evidence-based evaluation fallback when no external LLM is used."""
    lowered = transcription.lower().strip()
    words = re.findall(r"\b\w+\b", lowered)
    word_count = len(words)

    expected = [c.strip() for c in request.expected_concepts if c and c.strip()]
    if not expected and request.concept:
        expected = [request.concept.strip()]
    if not expected:
        expected = ["Core conceptual explanation", "Technical reasoning"]

    demonstrated: List[str] = []
    missing: List[str] = []

    for exp in expected:
        tokens = _concept_tokens(exp)
        if not tokens:
            continue
        matched_tokens = [t for t in tokens if t in lowered]
        if matched_tokens and (len(matched_tokens) / len(tokens) >= 0.5 or exp.lower() in lowered):
            demonstrated.append(exp)
        else:
            missing.append(exp)

    misconceptions: List[str] = []
    for pattern, description in _MISCONCEPTION_PATTERNS:
        if re.search(pattern, lowered):
            misconceptions.append(description)

    has_uncertainty = any(marker in lowered for marker in _UNCERTAINTY_MARKERS)
    reasoning_hits = [conn for conn in _REASONING_CONNECTIVES if conn in lowered]

    # Determine correctness, completeness, and reasoning_quality
    if misconceptions:
        correctness: CorrectnessLevel = "incorrect"
    elif has_uncertainty and word_count < 15 and not demonstrated:
        correctness = "unclear"
    elif demonstrated and not missing:
        correctness = "correct"
    elif demonstrated:
        correctness = "partially_correct"
    elif word_count < 6:
        correctness = "unclear"
    else:
        correctness = "incorrect"

    if demonstrated and not missing and not misconceptions and word_count >= 12:
        completeness: CompletenessLevel = "complete"
    elif demonstrated:
        completeness = "partial"
    else:
        completeness = "incomplete"

    if misconceptions:
        reasoning_quality: ReasoningQualityLevel = "unfounded"
    elif len(reasoning_hits) >= 2 and word_count >= 20:
        reasoning_quality = "strong"
    elif len(reasoning_hits) >= 1 or (demonstrated and word_count >= 10):
        reasoning_quality = "adequate"
    elif word_count >= 6:
        reasoning_quality = "weak"
    else:
        reasoning_quality = "unfounded"

    # Extract supporting evidence snippet from transcription
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", transcription.strip()) if s.strip()]
    supporting_evidence = sentences[:2] if sentences else [transcription.strip()[:200]]

    # Build knowledge gaps for missing concepts or misconceptions
    knowledge_gaps: List[KnowledgeGapItem] = []
    target_concept = request.concept or (expected[0] if expected else "Core Concept")

    for misc in misconceptions:
        knowledge_gaps.append(
            KnowledgeGapItem(
                concept=target_concept,
                severity="high",
                explanation=misc,
                recommendation=f"Review the fundamental mechanism of {target_concept} and verify how it behaves in your implementation.",
            )
        )

    for miss in missing:
        severity = "high" if correctness in ("incorrect", "unclear") else "medium"
        knowledge_gaps.append(
            KnowledgeGapItem(
                concept=miss,
                severity=severity,
                explanation=f"The response did not adequately address '{miss}' when answering the question.",
                recommendation=f"Practice explaining how '{miss}' connects to {target_concept} with concrete examples from your work.",
            )
        )

    if correctness == "correct" and completeness == "complete":
        feedback = (
            f"Strong explanation. You clearly demonstrated {', '.join(demonstrated)} "
            "and supported your answer with coherent technical reasoning."
        )
        explanation = (
            f"The student accurately addressed all expected concepts ({', '.join(demonstrated)}) "
            "and articulated causal reasoning without misconceptions."
        )
        needs_follow_up = False
        follow_up_dir = (
            f"Optional advanced scenario: test how {target_concept} behaves under modified system constraints."
        )
    elif misconceptions:
        feedback = (
            f"Your answer contains a conceptual misconception: {misconceptions[0]} "
            f"Consider revisiting how {target_concept} works."
        )
        explanation = (
            f"Detected a direct conceptual contradiction ({misconceptions[0]}). "
            f"Missing expected concepts: {', '.join(missing) or 'None'}."
        )
        needs_follow_up = True
        follow_up_dir = f"Probe misconception: {misconceptions[0]}"
    elif correctness == "partially_correct":
        feedback = (
            f"You correctly touched on {', '.join(demonstrated)}, but your explanation omitted "
            f"{', '.join(missing)}."
        )
        explanation = (
            f"Student demonstrated partial understanding ({', '.join(demonstrated)}) "
            f"but left out key concepts ({', '.join(missing)})."
        )
        needs_follow_up = True
        follow_up_dir = f"Ask a clarification follow-up focusing on {', '.join(missing[:2])}."
    else:
        feedback = (
            f"Your response did not clearly explain {', '.join(expected)}. "
            "Try walking through the specific mechanism and rationale in your submission."
        )
        explanation = (
            "The transcription lacked sufficient conceptual evidence for the expected concepts "
            f"({', '.join(expected)})."
        )
        needs_follow_up = True
        follow_up_dir = f"Scaffold and clarify the foundational role of {target_concept}."

    confidence = 0.85 if word_count >= 10 else 0.68
    uncertainty_notes = (
        "Response was very brief or contained hedging markers, which lowers evaluation certainty."
        if (word_count < 8 or has_uncertainty)
        else None
    )

    return AnswerEvaluateResponse(
        response_id=request.response_id,
        transcription=transcription,
        correctness=correctness,
        completeness=completeness,
        reasoning_quality=reasoning_quality,
        feedback=feedback,
        explanation=explanation,
        supporting_evidence=supporting_evidence,
        demonstrated_concepts=demonstrated,
        missing_concepts=missing,
        misconceptions=misconceptions,
        knowledge_gaps=knowledge_gaps,
        confidence=confidence,
        uncertainty_notes=uncertainty_notes,
        needs_follow_up=needs_follow_up,
        suggested_follow_up_direction=follow_up_dir,
    )


def _coerce_llm_evaluation(
    llm_data: Dict[str, Any],
    *,
    fallback: AnswerEvaluateResponse,
) -> AnswerEvaluateResponse:
    correctness = str(llm_data.get("correctness") or "").strip().lower()
    if correctness not in ("correct", "partially_correct", "incorrect", "unclear"):
        correctness = fallback.correctness

    completeness = str(llm_data.get("completeness") or "").strip().lower()
    if completeness not in ("complete", "partial", "incomplete"):
        completeness = fallback.completeness

    reasoning_quality = str(llm_data.get("reasoning_quality") or "").strip().lower()
    if reasoning_quality not in ("strong", "adequate", "weak", "unfounded"):
        reasoning_quality = fallback.reasoning_quality

    def _str_list(key: str, default: List[str]) -> List[str]:
        raw = llm_data.get(key)
        if isinstance(raw, list):
            return [str(x).strip() for x in raw if str(x).strip()]
        return default

    raw_conf = llm_data.get("confidence", fallback.confidence)
    try:
        confidence = max(0.0, min(1.0, float(raw_conf)))
    except (TypeError, ValueError):
        confidence = fallback.confidence

    knowledge_gaps: List[KnowledgeGapItem] = []
    raw_gaps = llm_data.get("knowledge_gaps")
    if isinstance(raw_gaps, list):
        for item in raw_gaps:
            if isinstance(item, dict) and item.get("concept"):
                sev = str(item.get("severity") or "medium").lower()
                if sev not in ("low", "medium", "high"):
                    sev = "medium"
                knowledge_gaps.append(
                    KnowledgeGapItem(
                        concept=str(item["concept"]).strip(),
                        severity=sev,  # type: ignore[arg-type]
                        explanation=str(item.get("explanation") or "Identified gap in explanation.").strip(),
                        recommendation=str(
                            item.get("recommendation") or f"Review {item['concept']} in your submission."
                        ).strip(),
                    )
                )
    if not knowledge_gaps and fallback.knowledge_gaps and correctness != "correct":
        knowledge_gaps = fallback.knowledge_gaps

    feedback = str(llm_data.get("feedback") or "").strip() or fallback.feedback
    explanation = str(llm_data.get("explanation") or "").strip() or fallback.explanation

    needs_follow_up = llm_data.get("needs_follow_up")
    if not isinstance(needs_follow_up, bool):
        needs_follow_up = correctness != "correct" or completeness != "complete"

    return AnswerEvaluateResponse(
        response_id=fallback.response_id,
        transcription=fallback.transcription,
        correctness=correctness,  # type: ignore[arg-type]
        completeness=completeness,  # type: ignore[arg-type]
        reasoning_quality=reasoning_quality,  # type: ignore[arg-type]
        feedback=feedback,
        explanation=explanation,
        supporting_evidence=_str_list("supporting_evidence", fallback.supporting_evidence),
        demonstrated_concepts=_str_list("demonstrated_concepts", fallback.demonstrated_concepts),
        missing_concepts=_str_list("missing_concepts", fallback.missing_concepts),
        misconceptions=_str_list("misconceptions", fallback.misconceptions),
        knowledge_gaps=knowledge_gaps,
        confidence=confidence,
        uncertainty_notes=(
            str(llm_data["uncertainty_notes"]).strip()
            if llm_data.get("uncertainty_notes")
            else fallback.uncertainty_notes
        ),
        needs_follow_up=needs_follow_up,
        suggested_follow_up_direction=(
            str(llm_data["suggested_follow_up_direction"]).strip()
            if llm_data.get("suggested_follow_up_direction")
            else fallback.suggested_follow_up_direction
        ),
    )


async def evaluate_answer_pipeline(
    request: AnswerEvaluateRequest,
    *,
    llm_completion_fn: Optional[Callable[[str, str], Any]] = None,
    stt_fn: Optional[Callable[[bytes, str], Any]] = None,
    strict_llm: bool = False,
) -> AnswerEvaluateResponse:
    """Transcribe (if audio provided) and evaluate a student's viva answer with supporting evidence."""
    transcription = await resolve_transcription(
        transcription=request.transcription,
        audio_base64=request.audio_base64,
        audio_url=request.audio_url,
        audio_mime_type=request.audio_mime_type,
        stt_fn=stt_fn,
    )

    fallback = _heuristic_evaluate_answer(request=request, transcription=transcription)

    user_prompt = build_answer_evaluation_user_prompt(
        question=request.question or "",
        concept=request.concept,
        expected_concepts=request.expected_concepts,
        transcription=transcription,
        document_context=request.document_context,
    )

    try:
        llm_data = await call_llm_json(
            system_prompt=ANSWER_EVALUATION_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.1,
            llm_completion_fn=llm_completion_fn,
        )
    except LLMResponseError:
        if strict_llm:
            raise
        return fallback

    if not llm_data:
        return fallback

    return _coerce_llm_evaluation(llm_data, fallback=fallback)
