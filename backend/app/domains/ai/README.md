# AI Domain — Models

Owns: no business schema — orchestration only.

Uses: `governance.ai_controls`, `governance.feature_flags` (via `api.is_feature_enabled()`).

Source: `docs/backend-architecture.md` ("AI Service"), `docs/service-architecture.md` ("AI Services"), `docs/domain-architecture.md` ("AI Domain"), `ADR-016`.

Scope is orchestration and integration plumbing only. AI-assisted decision-making features (campaign distribution, predictive analytics, autonomous moderation, recommendation engines) remain explicitly out of scope pending ADR approval, per `docs/phase-4-kickoff.md`.

This directory holds the TypeScript-side type definitions for calling the separate Python/FastAPI AI Service (`ADR-016`) — it does not contain that service's own source code. See `app/ai/` (top-level) for the integration contract, and `app/services/ai/` for the AI Application Service.
