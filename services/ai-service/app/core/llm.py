"""Resilient LLM client and structured JSON parser for Enigma AI pipelines."""

from __future__ import annotations

import json
import os
import re
from typing import Any, Callable, Dict, Optional

import httpx

from app.core.config import settings


class LLMResponseError(Exception):
    """Raised when an LLM provider fails or returns unparseable structured JSON."""


def parse_llm_json(raw_text: str) -> Dict[str, Any]:
    """Extract and parse a JSON object from an LLM completion string.

    Handles raw JSON, ```json ... ``` fenced blocks, and leading/trailing prose.
    Raises LLMResponseError if no valid JSON object can be parsed.
    """
    if not raw_text or not isinstance(raw_text, str):
        raise LLMResponseError("LLM returned an empty or non-string response.")

    cleaned = raw_text.strip()

    # 1. Strip markdown code fences if present
    fenced_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", cleaned, flags=re.DOTALL)
    if fenced_match:
        cleaned = fenced_match.group(1).strip()

    # 2. Direct JSON parse attempt
    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, dict):
            return parsed
        raise LLMResponseError("Expected top-level JSON object (dict), got list or primitive.")
    except json.JSONDecodeError:
        pass

    # 3. Attempt to locate the outermost {...} object
    first_brace = cleaned.find("{")
    last_brace = cleaned.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        candidate = cleaned[first_brace : last_brace + 1]
        try:
            parsed = json.loads(candidate)
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError as exc:
            raise LLMResponseError(f"Malformed JSON in LLM output: {exc}") from exc

    raise LLMResponseError("Unable to locate a valid JSON object in LLM output.")


async def call_llm_json(
    *,
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.2,
    llm_completion_fn: Optional[Callable[[str, str], Any]] = None,
) -> Optional[Dict[str, Any]]:
    """Invoke configured LLM provider (Groq or Gemini) and parse JSON response.

    If `llm_completion_fn` is injected (e.g. in unit tests), it is called directly
    and any `LLMResponseError` from `parse_llm_json` is propagated or handled by the caller.
    Returns `None` if no external LLM credentials are configured.
    """
    if llm_completion_fn is not None:
        raw_output = llm_completion_fn(system_prompt, user_prompt)
        if hasattr(raw_output, "__await__"):
            raw_output = await raw_output
        return parse_llm_json(raw_output)

    groq_key = (settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY", "")).strip()
    gemini_key = (settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")).strip()

    if groq_key:
        async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT_SECONDS) as client:
            response = await client.post(
                f"{settings.GROQ_BASE_URL.rstrip('/')}/chat/completions",
                headers={
                    "Authorization": f"Bearer {groq_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.GROQ_LLM_MODEL,
                    "temperature": temperature,
                    "response_format": {"type": "json_object"},
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                },
            )
            if response.status_code >= 400:
                raise LLMResponseError(
                    f"Groq API error (HTTP {response.status_code}): {response.text[:300]}"
                )
            payload = response.json()
            content = (
                payload.get("choices", [{}])[0]
                .get("message", {})
                .get("content", "")
            )
            return parse_llm_json(content)

    if gemini_key:
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{settings.GEMINI_LLM_MODEL}:generateContent?key={gemini_key}"
        )
        async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT_SECONDS) as client:
            response = await client.post(
                url,
                headers={"Content-Type": "application/json"},
                json={
                    "systemInstruction": {"parts": [{"text": system_prompt}]},
                    "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
                    "generationConfig": {
                        "temperature": temperature,
                        "responseMimeType": "application/json",
                    },
                },
            )
            if response.status_code >= 400:
                raise LLMResponseError(
                    f"Gemini API error (HTTP {response.status_code}): {response.text[:300]}"
                )
            payload = response.json()
            candidates = payload.get("candidates", [])
            if not candidates:
                raise LLMResponseError("Gemini returned no candidates.")
            parts = candidates[0].get("content", {}).get("parts", [])
            content = "".join(part.get("text", "") for part in parts)
            return parse_llm_json(content)

    return None
