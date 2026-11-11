# Agent Sync Board: DELL (Ehsaan/Qazi - Backend & Database)
Last Updated: 2026-11-11T12:56:00+05:00
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

## Published API Contracts Ready for Frontend (HP) & AI (Victus)
- `POST /api/submissions/upload-url` -> Ready (Accepts `{ title: string, filename: string, mimeType: "application/pdf", fileSize: number }`, returns `{ submissionId: string, uploadUrl: string, storagePath: string }`).
- `POST /api/submissions/complete` -> Ready (Accepts `{ submissionId: string }`, verifies upload, triggers AI analysis, updates status `uploaded -> processing -> ready`).
- `GET /api/submissions` & `GET /api/submissions/[id]` -> Ready (Enforces authenticated user ownership).
- `POST /api/viva/initiate` -> Ready (Accepts `{ submissionId: string }`, creates session, fetches AI questions, sets status `in_progress`).
- `GET /api/viva/[id]` -> Ready (Retrieves session, all questions, and recorded responses).
- `GET /api/viva/[id]/next` -> Ready (Returns next unanswered question or `{ isCompleted: true }`).
- `POST /api/viva/[id]/responses` -> Ready (Accepts `{ questionId: string, audioStoragePath?: string, transcription?: string }`, triggers AI answer evaluation & adaptive follow-up generation, persists evaluations & knowledge gaps).
- `GET /api/reports/[id]` -> Ready (Returns aggregate scores, demonstrated concepts, knowledge gaps, and question-by-question evaluations).
- `GET /api/auth/callback` -> Ready (Exchanges Supabase OAuth / email code for session).

## Outgoing Requests to Other Machines
- [REQUEST -> ADIL (VICTUS)] [OPEN] REQ-D1: Confirmed `X-Internal-Secret` header is passed from Next.js AI client. Please confirm `/internal/v1/answers/evaluate` returns `{ correctness: number, completeness: number, reasoning_quality: number, feedback: string, demonstrated_concepts: string[], missing_concepts: string[], potential_misconceptions?: string[], confidence: number }`.
- [REQUEST -> AHMED (HP)] [OPEN] REQ-D2: Submissions API workflow: Call `POST /api/submissions/upload-url` with `{ title, filename, mimeType, fileSize }`, PUT to returned signed upload URL, then call `POST /api/submissions/complete` with `{ submissionId }`.
- [REQUEST -> AHMED (HP)] [OPEN] REQ-D3: Viva assessment workflow: Call `POST /api/viva/initiate` with `{ submissionId }`, poll `GET /api/viva/[id]/next`, upload student audio to Supabase Storage `audio` bucket, and submit via `POST /api/viva/[id]/responses` with `{ questionId, audioStoragePath }`.

## Resolved Incoming Requests
- [RESOLVED -> ADIL (VICTUS)] REQ-V1: Added `X-Internal-Secret` with `AI_SERVICE_SECRET` to Next.js AI HTTP client.
