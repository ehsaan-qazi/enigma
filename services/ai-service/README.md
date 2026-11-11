# Enigma AI Service

Independent Python FastAPI service for document intelligence, personalized viva question generation, speech-to-text transcription, and evidence-based answer evaluation.

**Primary Owner:** Adil (`services/ai-service/`)

## Architecture & Responsibilities

The AI service is a private internal service consumed exclusively by the Next.js Backend-for-Frontend (BFF). It exposes four authenticated internal endpoints and one public health endpoint:

- `GET /health` — Service health & version check
- `POST /internal/v1/documents/analyze` — PDF/text extraction, topic & concept analysis
- `POST /internal/v1/questions/generate` — Personalized primary viva question generation
- `POST /internal/v1/answers/evaluate` — Audio transcription (optional) + evidence-based answer evaluation & misconception detection
- `POST /internal/v1/questions/follow-up` — Adaptive follow-up question generation based on prior evaluation

All `/internal/v1/*` endpoints verify the shared `X-Internal-Secret` header against `AI_SERVICE_SECRET`.

## Local Setup

```bash
cd services/ai-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Interactive OpenAPI documentation: `http://localhost:8000/docs`

## Running Tests

```bash
cd services/ai-service
.venv/bin/pytest -v
```
