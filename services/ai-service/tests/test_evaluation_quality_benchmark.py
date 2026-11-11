"""Human-reviewed AI evaluation quality & stability benchmark tests (README Section 3, 23, 25 Phase 6-7)."""

from __future__ import annotations

import json
from pathlib import Path

from fastapi.testclient import TestClient


FIXTURE_PATH = Path(__file__).resolve().parent / "fixtures" / "human_reviewed_cases.json"


def test_human_reviewed_evaluation_benchmark_agreement_and_paraphrase(client: TestClient):
    """Verify conceptual correctness agreement, paraphrase handling, and 0% false positives/negatives."""
    dataset = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))
    cases = dataset["evaluation_cases"]
    assert len(cases) >= 6

    agreements = 0
    false_positives = 0
    false_negatives = 0

    for case in cases:
        resp = client.post(
            "/internal/v1/answers/evaluate",
            json={
                "question": case["question"],
                "concept": case["concept"],
                "expected_concepts": case["expected_concepts"],
                "transcription": case["student_transcription"],
            },
        )
        assert resp.status_code == 200, f"Failed on {case['case_id']}"
        result = resp.json()
        expected = case["human_judgment"]

        # 1. Label agreement (distinguishing verbatim correct, paraphrased correct, partial, unclear, incorrect)
        assert result["correctness_label"] == expected["expected_label"], (
            f"Case {case['case_id']} expected label {expected['expected_label']}, "
            f"got {result['correctness_label']}"
        )
        agreements += 1

        # 2. Score bounds check
        if "min_correctness_score" in expected:
            assert result["correctness"] >= expected["min_correctness_score"]
        if "max_correctness_score" in expected:
            assert result["correctness"] <= expected["max_correctness_score"]

        # 3. Demonstrated & missing concepts check
        assert result["demonstrated_concepts"] == expected["expected_demonstrated"]
        assert result["missing_concepts"] == expected["expected_missing"]

        # 4. Misconception false positive / false negative tracking
        detected_misc = len(result["misconceptions"]) > 0
        if expected["has_misconception"] and not detected_misc:
            false_negatives += 1
        elif not expected["has_misconception"] and detected_misc:
            false_positives += 1

        assert result["needs_follow_up"] is expected["needs_follow_up"]

    assert agreements == len(cases)
    assert false_positives == 0
    assert false_negatives == 0


def test_evaluation_and_follow_up_stability_across_repeated_runs(client: TestClient):
    """Verify deterministic stability across repeated runs (README Section 23)."""
    payload = {
        "question": "Explain how your relational schema avoids common data integrity issues.",
        "concept": "Database Normalization",
        "expected_concepts": ["Data redundancy", "Data consistency", "Update anomalies"],
        "transcription": (
            "By splitting repeating groups into separate tables in 3NF, we avoid storing "
            "duplicate records in multiple places, so partial updates cannot leave conflicting values."
        ),
    }
    runs = [client.post("/internal/v1/answers/evaluate", json=payload).json() for _ in range(3)]
    assert runs[0]["correctness"] == runs[1]["correctness"] == runs[2]["correctness"]
    assert runs[0]["demonstrated_concepts"] == runs[1]["demonstrated_concepts"] == runs[2]["demonstrated_concepts"]


def test_session_report_synthesis_endpoint(client: TestClient):
    """Verify session-level report aggregation & diagnostic recommendations (README Section 4.6, Phase 6)."""
    resp = client.post(
        "/internal/v1/reports/synthesize",
        json={
            "vivaId": "viva-bench-1",
            "submissionTitle": "Distributed PostgreSQL Viva",
            "evaluations": [
                {
                    "question": "Why is database normalization important?",
                    "concept": "Database Normalization",
                    "transcription": "It reduces duplicate data and maintains referential integrity.",
                    "correctness": 90,
                    "completeness": 88,
                    "reasoning_quality": 86,
                    "demonstrated_concepts": ["Data redundancy", "Data consistency"],
                    "missing_concepts": [],
                    "misconceptions": [],
                    "confidence": 0.9,
                },
                {
                    "question": "How does Row Level Security work?",
                    "concept": "Row Level Security",
                    "transcription": "It filters rows per tenant.",
                    "correctness": 62,
                    "completeness": 55,
                    "reasoning_quality": 60,
                    "demonstrated_concepts": ["Tenant isolation"],
                    "missing_concepts": ["auth.uid() policy check"],
                    "misconceptions": [],
                    "confidence": 0.85,
                },
            ],
        },
    )
    assert resp.status_code == 200
    report = resp.json()
    assert report["viva_id"] == "viva-bench-1"
    assert report["overall_understanding_level"] in ("High", "Moderate")
    assert "Data redundancy" in report["demonstrated_concepts"]
    assert "Row Level Security" in report["partially_understood_concepts"]
    assert "auth.uid() policy check" in report["missing_concepts"]
    assert len(report["knowledge_gaps"]) >= 1
    assert len(report["improvement_recommendations"]) >= 1
    assert "diagnostic learning feedback" in report["assessment_disclaimer"]
