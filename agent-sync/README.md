# Multi-Agent GitHub Sync Board (`agent-sync/`)

This directory coordinates the 3 autonomous agents working across 3 machines over GitHub:

| Machine | Developer | Branch | Status File | Owned Paths |
| :--- | :--- | :--- | :--- | :--- |
| **Victus** | **Adil** (AI Engineer) | `agent/victus-adil-ai` | `agent-sync/victus-adil.md` | `services/ai-service/**`, `contracts/openapi.yaml` |
| **HP** | **Ahmed** (Frontend) | `agent/hp-ahmed-frontend` | `agent-sync/hp-ahmed.md` | `app/(auth)/**`, `app/(dashboard)/**`, `components/**`, `modules/*/{components,hooks,services,schemas,types}/**` |
| **Dell** | **Ehsaan / Qazi** (Backend & DB) | `agent/dell-qazi-backend` | `agent-sync/dell-qazi.md` | `app/api/**`, `modules/*/server/**`, `lib/**`, `supabase/**`, `contracts/openapi.yaml` |

## Sync Protocol

1. Run `git fetch --all --prune` before and after every task.
2. Read the other two machines' status files via:
   - `git show origin/agent/victus-adil-ai:agent-sync/victus-adil.md`
   - `git show origin/agent/hp-ahmed-frontend:agent-sync/hp-ahmed.md`
   - `git show origin/agent/dell-qazi-backend:agent-sync/dell-qazi.md`
3. Only modify your own status file (`agent-sync/<machine>-<owner>.md`) to prevent merge conflicts.
