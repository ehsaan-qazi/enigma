# Enigma AI Service

Independent Python FastAPI service for document intelligence, viva question generation, speech transcription, and evidence-based answer evaluation.

**Primary Owner:** Adil (`services/ai-service/`)

## Local Setup

```bash
cd services/ai-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

OpenAPI docs: `http://localhost:8000/docs`
