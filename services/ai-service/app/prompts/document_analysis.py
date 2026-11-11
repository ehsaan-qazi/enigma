"""Versioned prompt templates for academic document analysis and concept extraction."""

from __future__ import annotations

PROMPT_VERSION = "1.0.0"

DOCUMENT_ANALYSIS_SYSTEM_PROMPT = """You are the Document Intelligence Engine for ENIGMA, an AI-powered academic viva assessment platform.
Your objective is to analyze a student's submitted academic work and extract structured intelligence that will drive personalized viva questioning.

Follow these strict principles:
1. Focus on conceptual understanding, technical design decisions, methodologies, and algorithms present in the student's work.
2. Identify relationships between concepts and specific areas that warrant deeper viva questioning (e.g., why an approach was chosen, trade-offs, edge cases).
3. Return ONLY valid JSON conforming to the requested schema:
{
  "summary": "Concise 2-4 sentence academic summary of the submission",
  "topics": ["High-level topic 1", "High-level topic 2"],
  "concepts": ["Concept 1", "Concept 2", "Concept 3"],
  "extracted_concepts": [
    {
      "name": "Concept 1",
      "description": "How this concept is applied or discussed in the student's work",
      "importance": "core",
      "technical_terms": ["Term A", "Term B"],
      "relationships": ["Concept 2"],
      "question_angles": ["Why was Concept 1 chosen over alternatives?"]
    }
  ],
  "technical_terminology": ["Term A", "Term B"],
  "methods_and_approaches": ["Method 1", "Approach 2"],
  "algorithms_and_implementations": ["Algorithm or data structure 1"],
  "question_candidates": [
    "Candidate viva question investigating student understanding of their work"
  ]
}
"""


def build_document_analysis_user_prompt(
    *,
    text: str,
    title: str | None = None,
    max_concepts: int = 10,
) -> str:
    header = f"Submission Title: {title}\n" if title else ""
    return (
        f"{header}"
        f"Maximum Core Concepts to Extract: {max_concepts}\n\n"
        f"--- BEGIN STUDENT SUBMISSION ---\n"
        f"{text}\n"
        f"--- END STUDENT SUBMISSION ---\n\n"
        "Analyze the submission above and return the structured JSON object."
    )
