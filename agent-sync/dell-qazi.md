# Agent Sync Board: DELL (Ehsaan/Qazi - Backend & Database)
Last Updated: 2026-11-11T13:08:00+05:00
Branch: `agent/dell-qazi-backend`
Owner: Ehsaan / Qazi (`app/api/**`, `modules/*/server/**`, `lib/**`, `supabase/migrations/**`, `contracts/openapi.yaml`)

## Claimed & Active Tasks
- [DONE] BE-1: Create Supabase SQL migrations for all 7 tables + RLS policies + Storage buckets (Commit: c8eb1f4)
- [DONE] BE-2: Shared Backend Infrastructure, Zod validators & AI Service HTTP Adapter (`lib/api/ai-client.ts`) (Commit: c8eb1f4)
- [DONE] BE-3: Auth & Profiles Server Module (`modules/auth/server/`) & Auth Callback route (Commit: c8eb1f4)
- [DONE] BE-4: Submissions Server Module & `/api/submissions/*` Route Handlers (Commit: c8eb1f4)
- [DONE] BE-5: Viva & Evaluations Server Modules & `/api/viva/*` Route Handlers (Commit: c8eb1f4)
- [DONE] BE-6: Reports Server Module & `/api/reports/[id]` Route Handler (Commit: c8eb1f4)
- [DONE] BE-7: OpenAPI Contract Sync & Build Verification (Commit: c8eb1f4)
- [DONE] BE-8: Align Pydantic v2 schemas (REQ-V2) & Fulfill Frontend Submissions Flow contract (REQ-H1)

## Published API Contracts Ready for Frontend (HP) & AI (Victus)
- `POST /api/submissions/upload-url` -> Ready. Accepts `{ title: string, filename: string, mimeType?: string, fileSize?: number }` (also accepts `fileName`, `file_name`, `file_size`). Returns `{ submissionId: string, signedUrl: string, uploadUrl: string, path: string, storagePath: string }`.
- `POST /api/submissions/complete` -> Ready. Accepts `{ submissionId: string }` (or `submission_id`). Verifies upload, generates signed download URL for AI service, triggers document analysis & question generation, transitions status `uploaded -> processing -> ready`.
- `POST /api/viva/upload-url` -> Ready. Accepts `{ vivaId: string, filename?: string, mimeType?: string }`. Returns `{ vivaId: string, signedUrl: string, uploadUrl: string, path: string, storagePath: string }` for student voice audio upload.
- `PUT /api/storage/mock-upload` -> Ready. Accepts direct file PUT uploads during local offline dev when Supabase storage credentials are mock/offline.
- `GET /api/submissions` & `GET /api/submissions/[id]` -> Ready. Enforces authenticated student ownership.
- `POST /api/viva/initiate` -> Ready. Accepts `{ submissionId: string }`. Creates session, requests AI questions, sets status `in_progress`.
- `GET /api/viva/[id]` -> Ready. Retrieves viva session, all questions, and recorded responses.
- `GET /api/viva/[id]/next` -> Ready. Returns next unanswered question or `{ isCompleted: true }`.
- `POST /api/viva/[id]/responses` -> Ready. Accepts `{ questionId: string, audioStoragePath?: string, transcription?: string }` (also accepts snake_case aliases). Triggers STT transcription, AI answer evaluation with numeric normalization, adaptive follow-up question generation, and stores `responses`, `evaluations`, and `knowledge_gaps`.
- `GET /api/reports/[id]` -> Ready. Returns aggregate session scores, concept mastery, missing concepts, knowledge gaps, and question evaluations.
- `GET /api/auth/callback` -> Ready. Exchanges Supabase OAuth / email magic-link code for session.

## Outgoing Requests to Other Machines
- [REQUEST -> ADIL (VICTUS)] [OPEN] REQ-D1: Confirmed `X-Internal-Secret` header is passed from Next.js AI client. `lib/api/ai-client.ts` now supports both qualitative strings (`correct`, `partially_correct`, `strong`, `adequate`) and direct numeric scores (0-100), mapping both seamlessly.
- [REQUEST -> AHMED (HP)] [OPEN] REQ-D2: Submissions API workflow: Call `POST /api/submissions/upload-url`, upload file to `signedUrl`, then call `POST /api/submissions/complete` with `{ submissionId }`. Local mock upload is also supported via `PUT /api/storage/mock-upload`.
- [REQUEST -> AHMED (HP)] [OPEN] REQ-D3: Viva assessment workflow: Call `POST /api/viva/initiate` with `{ submissionId }`, poll `GET /api/viva/[id]/next`, upload student audio via `POST /api/viva/upload-url` signed URL, and submit via `POST /api/viva/[id]/responses` with `{ questionId, audioStoragePath }`.

## Resolved Incoming Requests
- [RESOLVED -> AHMED (HP)] REQ-H1: Updated `POST /api/submissions/upload-url` to return `{ submissionId, signedUrl, uploadUrl, path, storagePath }`. Updated `POST /api/submissions/complete` to validate `{ submissionId }` (and `submission_id`). Added `app/api/storage/mock-upload/route.ts` for offline testing.
- [RESOLVED -> ADIL (VICTUS)] REQ-V1: Added `X-Internal-Secret` with `AI_SERVICE_SECRET` to Next.js AI HTTP client.
- [RESOLVED -> ADIL (VICTUS)] REQ-V2: Aligned `lib/api/ai-client.ts` with Pydantic v2 schemas across all 4 endpoints (`/internal/v1/documents/analyze`, `/internal/v1/questions/generate`, `/internal/v1/answers/evaluate`, `/internal/v1/questions/follow-up`), supporting both camelCase and snake_case request keys, score normalization, structured knowledge gaps, and signed file URLs.
