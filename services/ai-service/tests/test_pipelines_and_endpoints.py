"""End-to-end pipeline and HTTP contract tests for all /internal/v1/* endpoints."""

from __future__ import annotations

import base64
from pathlib import Path

import yaml
from fastapi.testclient import TestClient


def test_document_analyze_with_text_and_pdf_and_bff_camelcase(
    client: TestClient, sample_pdf_base64: str
):
    # 1. Plain text analysis
    resp_text = client.post(
        "/internal/v1/documents/analyze",
        json={
            "submission_id": "sub-101",
            "title": "Relational Database Architecture",
            "content": (
                "Our system normalizes PostgreSQL tables to 3NF to eliminate data redundancy "
                "and uses Row Level Security (RLS) policies to isolate student records."
            ),
        },
    )
    assert resp_text.status_code == 200
    data_text = resp_text.json()
    assert data_text["submission_id"] == "sub-101"
    assert "Database Normalization" in data_text["concepts"]
    assert "Row Level Security (RLS)" in data_text["concepts"]
    assert len(data_text["extracted_concepts"]) >= 1

    # 2. PDF base64 extraction
    resp_pdf = client.post(
        "/internal/v1/documents/analyze",
        json={
            "submission_id": "sub-102",
            "pdf_base64": sample_pdf_base64,
        },
    )
    assert resp_pdf.status_code == 200
    data_pdf = resp_pdf.json()
    assert data_pdf["extracted_text_length"] > 20
    assert len(data_pdf["concepts"]) >= 1

    # 3. Next.js BFF camelCase payload with storagePath
    resp_bff = client.post(
        "/internal/v1/documents/analyze",
        json={
            "submissionId": "sub-103",
            "storagePath": "user-1/sub-103/distributed-systems.pdf",
            "documentTitle": "Distributed Systems & Concurrency",
        },
    )
    assert resp_bff.status_code == 200
    assert resp_bff.json()["topics"]

    # 4. Missing document source -> 422
    resp_invalid = client.post(
        "/internal/v1/documents/analyze",
        json={"submission_id": "sub-empty"},
    )
    assert resp_invalid.status_code == 422


def test_question_generation_primary_and_bff_camelcase(client: TestClient):
    resp = client.post(
        "/internal/v1/questions/generate",
        json={
            "submissionId": "sub-201",
            "concepts": ["Database Normalization", "Row Level Security", "Asynchronous Queues"],
            "topics": ["Backend Engineering"],
            "count": 4,
            "difficulty": "medium",
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["questions"]) == 4
    for idx, q in enumerate(body["questions"], start=1):
        assert q["id"] == f"q{idx}"
        assert q["difficulty"] == "medium"
        assert q["question"] == q["question_text"]
        assert len(q["expected_concepts"]) >= 2


def test_answer_evaluation_correct_partial_misconception_and_audio(client: TestClient):
    # 1. Strong, accurate student answer (BFF camelCase payload)
    resp_strong = client.post(
        "/internal/v1/answers/evaluate",
        json={
            "vivaId": "viva-1",
            "questionId": "q-1",
            "questionText": "Why is database normalization important in your schema?",
            "concept": "Database Normalization",
            "expectedConcepts": ["Data redundancy", "Data consistency", "Update anomalies"],
            "transcription": (
                "Database normalization is important because it reduces data redundancy "
                "and prevents update anomalies, which ensures data consistency across tables."
            ),
        },
    )
    assert resp_strong.status_code == 200
    strong_data = resp_strong.json()
    assert strong_data["correctness"] >= 80
    assert strong_data["completeness"] >= 80
    assert strong_data["correctness_label"] == "correct"
    assert "Data redundancy" in strong_data["demonstrated_concepts"]
    assert strong_data["missing_concepts"] == []
    assert strong_data["misconceptions"] == []
    assert strong_data["potential_misconceptions"] == []
    assert 0.0 <= strong_data["confidence"] <= 1.0

    # 2. Answer with a conceptual misconception
    resp_misc = client.post(
        "/internal/v1/answers/evaluate",
        json={
            "question": "Why is database normalization important?",
            "concept": "Database Normalization",
            "expected_concepts": ["Data redundancy", "Data consistency"],
            "transcription": "Database normalization increases redundancy in every table.",
        },
    )
    assert resp_misc.status_code == 200
    misc_data = resp_misc.json()
    assert misc_data["correctness"] < 50
    assert misc_data["correctness_label"] == "incorrect"
    assert len(misc_data["misconceptions"]) >= 1
    assert misc_data["potential_misconceptions"] == misc_data["misconceptions"]
    assert len(misc_data["knowledge_gaps"]) >= 1
    assert misc_data["needs_follow_up"] is True

    # 3. Audio base64 evaluation
    audio_b64 = base64.b64encode(
        b"Row level security ensures tenant isolation because policies check auth.uid()."
    ).decode("ascii")
    resp_audio = client.post(
        "/internal/v1/answers/evaluate",
        json={
            "question": "How does Row Level Security isolate student data?",
            "concept": "Row Level Security",
            "expected_concepts": ["Tenant isolation", "auth.uid()"],
            "audio_base64": audio_b64,
        },
    )
    assert resp_audio.status_code == 200
    audio_data = resp_audio.json()
    assert "tenant isolation" in audio_data["transcription"].lower()
    assert audio_data["correctness"] >= 80


def test_adaptive_follow_up_and_transcribe_endpoints(client: TestClient):
    # 1. Follow-up when missing concepts exist (BFF camelCase payload)
    resp_fu_partial = client.post(
        "/internal/v1/questions/follow-up",
        json={
            "vivaId": "viva-1",
            "questionText": "Explain database normalization.",
            "concept": "Database Normalization",
            "transcription": "It organizes tables.",
            "evaluation": {
                "correctness": 60,
                "completeness": 50,
                "feedback": "Partial explanation.",
                "missing_concepts": ["Update anomalies", "Third Normal Form (3NF)"],
            },
        },
    )
    assert resp_fu_partial.status_code == 200
    fu_partial = resp_fu_partial.json()
    assert "Update anomalies" in fu_partial["question"]
    assert fu_partial["question"] == fu_partial["follow_up_question"]
    assert fu_partial["expected_concepts"]

    # 2. Follow-up when student gave a strong answer -> escalates to 'hard' scenario
    resp_fu_strong = client.post(
        "/internal/v1/questions/follow-up",
        json={
            "original_question": "Explain database normalization.",
            "concept": "Database Normalization",
            "student_response": "Detailed explanation of 3NF and referential integrity.",
            "evaluation_result": {
                "correctness": 92,
                "completeness": 90,
                "missing_concepts": [],
            },
        },
    )
    assert resp_fu_strong.status_code == 200
    fu_strong = resp_fu_strong.json()
    assert fu_strong["difficulty"] == "hard"
    assert fu_strong["generated_question"]["question_type"] == "scenario"

    # 3. Standalone /internal/v1/transcribe endpoint
    resp_stt = client.post(
        "/internal/v1/transcribe",
        json={"audioStoragePath": "user-1/viva-1/response-1.webm"},
    )
    assert resp_stt.status_code == 200
    assert len(resp_stt.json()["transcription"]) > 10


def test_openapi_contract_file_is_valid_and_synced():
    repo_root = Path(__file__).resolve().parents[2].parent
    contract_path = repo_root / "contracts" / "openapi.yaml"
    assert contract_path.exists()

    spec = yaml.safe_load(contract_path.read_text(encoding="utf-8"))
    assert spec["openapi"] == "3.1.0"
    paths = spec["paths"]
    for required_path in [
        "/internal/v1/documents/analyze",
        "/internal/v1/questions/generate",
        "/internal/v1/answers/evaluate",
        "/internal/v1/questions/follow-up",
        "/internal/v1/transcribe",
    ]:
        assert required_path in paths
