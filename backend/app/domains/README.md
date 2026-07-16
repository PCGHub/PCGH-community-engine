# app/domains/ — Domain Models

Per-domain type definitions, entities, and contracts only. No business logic, no services, no controllers, no repositories. Business workflow logic belongs in `app/services/`, not here (`docs/domain-architecture.md`, `docs/backend-architecture.md` "Folder Structure").

Ten domains, matching `docs/domain-architecture.md`'s API Ownership mapping one-to-one. Authentication has no directory here — it owns no business schema and is Infrastructure, not a domain (`app/auth/` instead; see `docs/domain-architecture.md`'s "Authentication Domain").

| Directory | Owns (schema) | Source |
|---|---|---|
| `identity/` | `identity` | `docs/identity-schema.md` |
| `campaign/` | `economy.campaigns`, `campaign_asset`, `campaign_distributions` | `docs/economy-schema.md` (campaign tables) |
| `discovery/` | `discovery` | `docs/discovery-schema.md` |
| `protection/` | `protection` | `docs/protection-schema.md` |
| `intelligence/` | `intelligence` | `docs/intelligence-schema.md` |
| `analytics/` | `analytics` | `docs/analytics-schema.md` |
| `governance/` | `governance` | `docs/governance-schema.md` |
| `notification/` | none (event-driven) | `docs/backend-architecture.md` |
| `payment/` | `economy.credit_wallets`, `credit_transactions` | `docs/economy-schema.md` (wallet tables) |
| `ai/` | none (orchestration only) | `docs/backend-architecture.md`, `ADR-016` |

Each subdirectory's own `README.md` restates its scope from `docs/domain-architecture.md`.
