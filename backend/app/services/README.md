# app/services/ — Domain Services

Workflow orchestration logic that operates on the types defined in `app/domains/`. Categorized per `docs/service-architecture.md`. No direct business-schema queries — every service consumes the `api` schema exclusively (`docs/service-architecture.md`, "Dependency Rules").

| Directory | Category | Responsibilities (per `docs/backend-architecture.md`) |
|---|---|---|
| `campaign/` | Application | Campaign creation, scheduling, publishing, closing, archiving, rotation orchestration |
| `payment/` | Application | Flutterwave integration, payment verification, wallet operations, bonus payouts |
| `notification/` | Application | Email, in-app notifications, future push notifications |
| `ai/` | Application | AI orchestration, prompt management (integrates the separate Python/FastAPI AI Service, `ADR-016`) |
| `identity/` | Domain | User profiles, creator profiles, community membership, account lifecycle |
| `discovery/` | Domain | Discovery opportunities, assignment coordination, distribution analytics |
| `protection/` | Domain | Exclusions, cooldown monitoring, rotation history, abuse prevention |
| `intelligence/` | Domain | Reputation, badges, achievements, bonus orchestration |
| `analytics/` | Domain | Dashboards, reporting, aggregated metrics |
| `governance/` | Domain | Feature flags, AI controls, system settings, governance rules, administrative overrides |

Authentication and Storage are Infrastructure Services and live under `app/auth/` and `app/storage/` respectively, not here (`docs/service-architecture.md`, "Infrastructure Services").

No workflow logic is implemented in this scaffold. See `docs/phase-5-roadmap.md` Steps 4-12 for the implementation sequence.
