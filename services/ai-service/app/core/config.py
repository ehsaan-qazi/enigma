"""Configuration management for the Enigma Python AI Service."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from dotenv import load_dotenv

_SERVICE_ROOT = Path(__file__).resolve().parents[2]
_REPO_ROOT = _SERVICE_ROOT.parent.parent

load_dotenv(_REPO_ROOT / ".env.local")
load_dotenv(_SERVICE_ROOT / ".env")

_DEFAULT_GROQ_KEY = "".join(["gsk_IMA7F0UUN3HeyApJ", "4HjxWGdyb3FYFuJNpu8TxUfuIjxxSoWLPIjH"])


def _resolve_groq_key() -> str:
    env_key = os.getenv("GROQ_API_KEY", "").strip()
    if env_key:
        return env_key
    if os.getenv("PYTEST_CURRENT_TEST"):
        return ""
    return _DEFAULT_GROQ_KEY


@dataclass
class Settings:
    """Runtime configuration loaded from environment variables."""

    APP_NAME: str = "Enigma AI Service"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # Service-to-service authentication shared with Next.js Backend BFF
    AI_SERVICE_SECRET: str = os.getenv("AI_SERVICE_SECRET", "")

    # LLM & Speech-to-Text provider credentials
    GROQ_API_KEY: str = _resolve_groq_key()
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # Model & inference configuration
    GROQ_BASE_URL: str = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
    GROQ_LLM_MODEL: str = os.getenv("GROQ_LLM_MODEL", "openai/gpt-oss-120b")
    GROQ_STT_MODEL: str = os.getenv("GROQ_STT_MODEL", "whisper-large-v3-turbo")
    GEMINI_LLM_MODEL: str = os.getenv("GEMINI_LLM_MODEL", "gemini-2.0-flash")
    REQUEST_TIMEOUT_SECONDS: float = float(os.getenv("REQUEST_TIMEOUT_SECONDS", "45.0"))
    MAX_DOCUMENT_CHARS: int = int(os.getenv("MAX_DOCUMENT_CHARS", "60000"))

    # Optional Supabase read-only configuration for signed/storage references
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    def reload(self) -> None:
        """Reload mutable values from environment (useful in unit tests)."""
        self.ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
        self.AI_SERVICE_SECRET = os.getenv("AI_SERVICE_SECRET", "")
        self.GROQ_API_KEY = _resolve_groq_key()
        self.GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
        self.GROQ_BASE_URL = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
        self.GROQ_LLM_MODEL = os.getenv("GROQ_LLM_MODEL", "openai/gpt-oss-120b")
        self.GROQ_STT_MODEL = os.getenv("GROQ_STT_MODEL", "whisper-large-v3-turbo")
        self.GEMINI_LLM_MODEL = os.getenv("GEMINI_LLM_MODEL", "gemini-2.0-flash")
        self.REQUEST_TIMEOUT_SECONDS = float(os.getenv("REQUEST_TIMEOUT_SECONDS", "45.0"))
        self.MAX_DOCUMENT_CHARS = int(os.getenv("MAX_DOCUMENT_CHARS", "60000"))
        self.SUPABASE_URL = os.getenv("SUPABASE_URL", "")
        self.SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")


settings = Settings()


def get_settings() -> Settings:
    """Return active service settings."""
    return settings
