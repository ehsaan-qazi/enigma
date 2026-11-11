# Enigma AI Service

Independent Python FastAPI service for document intelligence, personalized viva question generation, speech-to-text transcription, evidence-based answer evaluation, and diagnostic report synthesis.

**Primary Owner:** Adil (`services/ai-service/`)

## Architecture & Endpoints

The AI service is a private internal service consumed exclusively by the Next.js Backend-for-Frontend (BFF). All `/internal/v1/*` endpoints verify the shared `X-Internal-Secret` header against `AI_SERVICE_SECRET`:

- `GET /health` — Service health & version check
- `POST /internal/v1/documents/analyze` — PDF/text/URL/storage extraction, topic & concept analysis
- `POST /internal/v1/questions/generate` — Personalized primary viva question generation with difficulty & expected concepts
- `POST /internal/v1/answers/evaluate` — Audio transcription + evidence-based answer evaluation, semantic paraphrase recognition, misconception detection, and knowledge gaps
- `POST /internal/v1/questions/follow-up` — Adaptive follow-up question generation (clarification, misconception probing, or scenario transfer)
- `POST /internal/v1/transcribe` (and `/internal/v1/answers/transcribe`) — Standalone speech-to-text audio transcription
- `POST /internal/v1/reports/synthesize` (and `/internal/v1/answers/synthesize-report`) — Session-level diagnostic assessment report synthesis

## Local Setup

```bash
cd services/ai-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Interactive OpenAPI documentation: `http://localhost:8000/docs`

## Running Tests & Evaluation Quality Benchmarks

```bash
cd services/ai-service
.venv/bin/pytest -v
```
