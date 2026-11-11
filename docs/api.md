# Enigma API Reference

See [`contracts/openapi.yaml`](../contracts/openapi.yaml) and Section 15 of [`/README.md`](../README.md) for the complete API contract.

## Public Next.js BFF Endpoints (Owned by Qazi, Consumed by Ahmed)

- `POST /api/submissions/upload-url`
- `POST /api/submissions/complete`
- `GET /api/submissions/:id`
- `POST /api/viva/initiate`
- `GET /api/viva/:id`
- `GET /api/viva/:id/next`
- `POST /api/viva/:id/responses`
- `GET /api/reports/:id`

## Internal Python AI Service Endpoints (Owned by Adil, Consumed by Qazi)

- `POST /internal/v1/documents/analyze`
- `POST /internal/v1/questions/generate`
- `POST /internal/v1/answers/evaluate`
- `POST /internal/v1/questions/follow-up`
