"""Pytest configuration and shared fixtures for Enigma AI Service tests."""

from __future__ import annotations

import base64
import os
import sys
from pathlib import Path
from typing import Iterator

import pytest
from fastapi.testclient import TestClient

SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from app.core.config import settings  # noqa: E402
from app.main import app  # noqa: E402


def build_minimal_pdf_bytes(text: str = "PostgreSQL Normalization and Row Level Security") -> bytes:
    """Create a valid single-page PDF byte stream containing `text` for PDF extraction tests."""
    escaped = text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
    content_stream = f"BT /F1 12 Tf 72 720 Td ({escaped}) Tj ET".encode("latin-1")

    objects = [
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
        (
            b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            b"/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n"
        ),
        (
            f"4 0 obj\n<< /Length {len(content_stream)} >>\nstream\n".encode("latin-1")
            + content_stream
            + b"\nendstream\nendobj\n"
        ),
        b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    ]

    pdf = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for obj in objects:
        offsets.append(len(pdf))
        pdf.extend(obj)

    xref_pos = len(pdf)
    pdf.extend(f"xref\n0 {len(offsets)}\n".encode("latin-1"))
    pdf.extend(b"0000000000 65535 f \n")
    for off in offsets[1:]:
        pdf.extend(f"{off:010d} 00000 n \n".encode("latin-1"))

    pdf.extend(
        (
            f"trailer\n<< /Size {len(offsets)} /Root 1 0 R >>\n"
            f"startxref\n{xref_pos}\n%%EOF\n"
        ).encode("latin-1")
    )
    return bytes(pdf)


@pytest.fixture(autouse=True)
def reset_env_settings(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    """Ensure deterministic offline test environment unless overridden in specific tests."""
    monkeypatch.setenv("AI_SERVICE_SECRET", "")
    monkeypatch.setenv("GROQ_API_KEY", "")
    monkeypatch.setenv("GEMINI_API_KEY", "")
    settings.reload()
    yield
    settings.reload()


@pytest.fixture
def client() -> TestClient:
    """Return a FastAPI TestClient instance."""
    return TestClient(app)


@pytest.fixture
def sample_pdf_base64() -> str:
    """Return a base64-encoded valid PDF containing academic technical concepts."""
    pdf_bytes = build_minimal_pdf_bytes(
        "Database Normalization up to 3NF reduces data redundancy and Row Level Security enforces tenant isolation."
    )
    return base64.b64encode(pdf_bytes).decode("ascii")
