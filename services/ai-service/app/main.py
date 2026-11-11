"""Enigma Independent Python AI Service — Owned by Adil."""

from fastapi import FastAPI
from app.api.routes import documents, questions, answers

app = FastAPI(
    title="Enigma AI Service",
    description="Internal FastAPI service for document intelligence, viva question generation, STT, and answer evaluation.",
    version="0.1.0",
)

app.include_router(documents.router, prefix="/internal/v1/documents", tags=["Documents"])
app.include_router(questions.router, prefix="/internal/v1/questions", tags=["Questions"])
app.include_router(answers.router, prefix="/internal/v1/answers", tags=["Answers"])


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "enigma-ai-service"}
