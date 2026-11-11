"""Pydantic schemas for answer evaluation."""

from pydantic import BaseModel
from typing import List


class AnswerEvaluateResponse(BaseModel):
    correctness: str
    completeness: str
    reasoning_quality: str
    feedback: str
    demonstrated_concepts: List[str]
    missing_concepts: List[str]
    confidence: float
