"""Pydantic schemas for document analysis."""

from pydantic import BaseModel
from typing import List


class DocumentAnalyzeRequest(BaseModel):
    submission_id: str
    content: str


class DocumentAnalyzeResponse(BaseModel):
    topics: List[str]
    concepts: List[str]
    summary: str
