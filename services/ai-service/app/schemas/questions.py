"""Pydantic schemas for question and follow-up generation."""

from pydantic import BaseModel
from typing import List


class GeneratedQuestion(BaseModel):
    id: str
    concept: str
    question: str
    difficulty: str
    expected_concepts: List[str]


class QuestionGenerateResponse(BaseModel):
    questions: List[GeneratedQuestion]
