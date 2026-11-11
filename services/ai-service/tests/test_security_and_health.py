"""Tests for /health endpoint and X-Internal-Secret authentication enforcement."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings


def test_health_check_always_public(client: TestClient, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("AI_SERVICE_SECRET", "super-secret-token")
    settings.reload()

    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["service"] == "enigma-ai-service"


def test_internal_routes_reject_missing_or_wrong_secret(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
):
    monkeypatch.setenv("AI_SERVICE_SECRET", "victus-dell-shared-secret")
    settings.reload()

    # Missing header -> 401
    resp_missing = client.post(
        "/internal/v1/documents/analyze",
        json={"submission_id": "sub-1", "content": "Database normalization and indexing."},
    )
    assert resp_missing.status_code == 401

    # Wrong header -> 401
    resp_wrong = client.post(
        "/internal/v1/documents/analyze",
        headers={"X-Internal-Secret": "wrong-secret"},
        json={"submission_id": "sub-1", "content": "Database normalization and indexing."},
    )
    assert resp_wrong.status_code == 401


def test_internal_routes_accept_valid_secret_header_and_bearer(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
):
    monkeypatch.setenv("AI_SERVICE_SECRET", "victus-dell-shared-secret")
    settings.reload()

    # Valid X-Internal-Secret header
    resp_ok = client.post(
        "/internal/v1/documents/analyze",
        headers={"X-Internal-Secret": "victus-dell-shared-secret"},
        json={"submission_id": "sub-1", "content": "Database normalization and indexing."},
    )
    assert resp_ok.status_code == 200
    assert "concepts" in resp_ok.json()

    # Valid Authorization: Bearer <secret>
    resp_bearer = client.post(
        "/internal/v1/documents/analyze",
        headers={"Authorization": "Bearer victus-dell-shared-secret"},
        json={"submission_id": "sub-1", "content": "Database normalization and indexing."},
    )
    assert resp_bearer.status_code == 200
