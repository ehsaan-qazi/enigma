# Enigma Development Guide

## Local Development

### 1. Next.js Application (Frontend & Backend BFF)

```bash
npm install
npm run dev
```

Runs at `http://localhost:3000`.

### 2. Independent Python AI Service

```bash
cd services/ai-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Runs at `http://localhost:8000` (Swagger UI: `http://localhost:8000/docs`).
