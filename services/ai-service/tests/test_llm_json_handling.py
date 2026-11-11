"""Unit tests for LLM structured JSON parsing and malformed JSON handling across pipelines."""

from __future__ import annotations

import asyncio
import pytest

from app.core.llm import LLMResponseError, parse_llm_json
from app.pipelines.answer_evaluation import evaluate_answer_pipeline
from app.pipelines.document_analysis import analyze_document_pipeline
from app.pipelines.question_generation import (
    generate_follow_up_pipeline,
    generate_questions_pipeline,
)
from app.schemas.answers import AnswerEvaluateRequest
from app.schemas.documents import DocumentAnalyzeRequest
from app.schemas.questions import FollowUpGenerateRequest, QuestionGenerateRequest


def test_parse_llm_json_handles_raw_and_fenced_blocks():
    raw = '{"topics": ["Databases"], "concepts": ["Normalization"], "summary": "Good work."}'
    assert parse_llm_json(raw)["concepts"] == ["Normalization"]

    fenced = 'Here is the analysis:\n```json\n{"topics": ["AI"], "concepts": ["Transformers"], "summary": "Attention."}\n```\nThanks!'
    assert parse_llm_json(fenced)["concepts"] == ["Transformers"]

    prose_wrapped = 'Sure! {"correctness": 92, "completeness": 88} End of output.'
    assert parse_llm_json(prose_wrapped)["correctness"] == 92


@pytest.mark.parametrize(
    "bad_input",
    [
        "",
        "Not JSON at all",
        "```json\n{unclosed_key: 123\n```",
        "[1, 2, 3]",
    ],
)
def test_parse_llm_json_raises_on_malformed_input(bad_input: str):
    with pytest.raises(LLMResponseError):
        parse_llm_json(bad_input)


def test_pipelines_handle_malformed_llm_json_gracefully_and_strict():
    def broken_llm(_sys: str, _usr: str) -> str:
        return "```json\n{truncated_json: [1, 2,\n```"

    doc_req = DocumentAnalyzeRequest(
        submission_id="sub-err",
        content="We implemented PostgreSQL normalization and B-Tree indexing for low-latency queries.",
    )
    # In strict_llm=True mode, raises LLMResponseError
    with pytest.raises(LLMResponseError):
        asyncio.run(
            analyze_document_pipeline(doc_req, llm_completion_fn=broken_llm, strict_llm=True)
        )

    # In default resilient mode, falls back cleanly to heuristic analysis
    doc_res = asyncio.run(analyze_document_pipeline(doc_req, llm_completion_fn=broken_llm))
    assert len(doc_res.concepts) >= 1
    assert doc_res.summary

    # Question generation resilient fallback on malformed LLM output
    q_req = QuestionGenerateRequest(
        submission_id="sub-err",
        concepts=["Database Normalization", "B-Tree Indexing"],
        num_questions=2,
    )
    q_res = asyncio.run(generate_questions_pipeline(q_req, llm_completion_fn=broken_llm))
    assert len(q_res.questions) == 2

    # Answer evaluation resilient fallback on malformed LLM output
    eval_req = AnswerEvaluateRequest(
        question="Explain B-Tree indexing.",
        expected_concepts=["Logarithmic lookup", "Balanced tree"],
        transcription="B-Tree indexing keeps keys sorted in a balanced tree so lookups are logarithmic.",
    )
    eval_res = asyncio.run(evaluate_answer_pipeline(eval_req, llm_completion_fn=broken_llm))
    assert 0 <= eval_res.correctness <= 100
    assert eval_res.demonstrated_concepts

    # Follow-up generation resilient fallback on malformed LLM output
    fu_req = FollowUpGenerateRequest(
        original_question="Explain B-Tree indexing.",
        concept="B-Tree Indexing",
        student_response="It is a tree structure.",
        evaluation_result={"correctness": 55, "missing_concepts": ["Write amplification"]},
    )
    fu_res = asyncio.run(generate_follow_up_pipeline(fu_req, llm_completion_fn=broken_llm))
    assert fu_res.question
    assert fu_res.expected_concepts
