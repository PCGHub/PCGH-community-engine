# app/

Application source root, per `docs/backend-architecture.md`'s "Folder Structure."

## Directories

- `api/` — Thin controllers: request validation, authentication, authorization, calling a service, formatting the response. No business logic (`docs/backend-architecture.md`, "Thin API Layer").
- `auth/` — Authentication Service (Infrastructure). Per `docs/authentication-architecture.md`.
- `domains/` — Domain Models: per-domain type definitions/entities/contracts, no logic. See `domains/README.md`.
- `services/` — Domain Services: workflow orchestration logic, categorized per `docs/service-architecture.md`. See `services/README.md`.
- `repositories/` — Thin wrappers around calling `api.*` views/functions/procedures. Never construct SQL or query a business schema directly (`docs/domain-architecture.md`, "Repositories").
- `middleware/` — Cross-cutting request middleware.
- `permissions/` — Advisory, UX-level permission checks only. Row Level Security remains the actual authorization boundary (`docs/authentication-architecture.md`).
- `events/` — Event definitions matching `analytics.analytics_events`'s governed vocabulary.
- `jobs/` — Background/asynchronous processing (idempotent, retry-safe).
- `notifications/` — Notification Service (Application).
- `integrations/` — External system connectors (Flutterwave, email, object storage, AI providers).
- `storage/` — Storage Service (Infrastructure).
- `ai/` — Integration contract for the separate Python/FastAPI AI Service (`ADR-016`). Does not contain the AI Service's own source code.
- `config/` — Configuration and environment handling.
- `utils/` — Shared, domain-agnostic utilities.
