"""Configuration for Enigma AI Service."""

import os


class Settings:
    AI_SERVICE_SECRET: str = os.getenv("AI_SERVICE_SECRET", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")


settings = Settings()
