# Enigma System Architecture

Enigma uses a **Modular Monolith architecture** for the Next.js application (Frontend UI + Backend-for-Frontend Route Handlers) paired with an **independent Python FastAPI AI service** and **Supabase** (PostgreSQL, Auth, Private Storage).

## Ownership Boundaries

- **Ahmed (Frontend — Machine `hp`)**: `app/(auth)/`, `app/(dashboard)/`, `components/`, `modules/*/{components,hooks,services,schemas,types}/`
- **Qazi (Backend & DB — Machine `dell`)**: `app/api/`, `modules/*/server/`, `lib/supabase/`, `lib/validation/`, `lib/api/`, `supabase/migrations/`, `contracts/openapi.yaml`
- **Adil (AI Service — Machine `victus`)**: `services/ai-service/`, `contracts/openapi.yaml`

See root `/README.md` for full architectural details.
