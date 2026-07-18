# PCGH Engineering Principles

Status:
ACTIVE — living governance document

Hierarchy Level:
Level 1 — Project Governance (Live)

Phase:
Cross-phase — permanent governance, not superseded by phase transitions

Effective:
2026-07-17, per Chief Architect Governance Directive

---

# Purpose

This document is the permanent, authoritative reference for every architecture principle, engineering rule, governance policy, quality gate, and development standard established during this project. It exists so that future implementation work — by the Founder, Claude, ChatGPT, or any future contributor — references a documented rule by its stable identifier, rather than relying on conversational context or precedent buried in chat history.

Nothing in this document invents a new rule. Every entry below codifies a principle that was already established and consistently demonstrated during Phases 3–5 — this document makes each one explicit, permanent, and citable. Where a rule's origin is a specific decision or a specific enforcement moment in the project's actual history, that is cited as its Source, not a hypothetical justification.

---

# Scope and Precedence

This document does not outrank `implementation-rules.md`, `documentation-governance-framework.md`, or `CLAUDE.md` — it sits in the Level 1 internal precedence order immediately after `implementation-playbook.md`, per `docs/documentation-governance-framework.md` Section 1a (updated alongside this document). Where this document and a higher-precedence Level 1 document disagree, the higher document governs.

This document governs *how work is done* (engineering discipline, quality gates, standards). It does not decide *what* is approved architecture — that remains the role of Level 2 architecture documents, ADRs, and the Architecture Change Lifecycle.

---

# Identifier Scheme

Every rule has a stable, permanent identifier in one of four series. Identifiers are never renumbered or reused, even if a rule is later superseded — a superseded rule is marked as such, not deleted, so historical references remain valid.

```text
AGR — Architecture Governance Rules
EPR — Engineering Principles
DSR — Development Standards
QGR — Quality Gate Rules
```

Future work should cite rules directly, e.g. "per AGR-004, this reuses the `api` schema" rather than re-explaining the reasoning inline.

---

# Architecture Governance Rules (AGR)

### AGR-001 — Documentation Precedes Implementation

No implementation begins without an approved governing document. If one doesn't exist for what's about to be built, it is written and approved first.

**Source:** `CLAUDE.md` ("Architecture First. Implementation Second."). Demonstrated concretely when Phase 5 Step 13 dashboard implementation was paused mid-stream, specifically because `docs/frontend-architecture.md` didn't yet exist, and was not resumed until that document was written, refined, and locked.

### AGR-002 — Architecture Change Lifecycle

Any new architectural decision — a new schema, a new external integration, a new domain, or a materially different technical approach — follows: Proposal → Architecture Review → ADR → Documentation Update → Implementation. It is never implemented directly and documented afterward.

**Source:** `documentation-governance-framework.md` §5a. Demonstrated by ADR-016 (AI Service Python/FastAPI exception) and ADR-017 (Payment Credit Pipeline), both raised as proposals rather than implemented ahead of approval.

### AGR-003 — Documentation Authority Order

Where governing documents conflict: Implementation Rules → Documentation Governance Framework → CLAUDE.md → Implementation Playbook → this document → Level 2 Architecture documents → Level 3 Schema documents → ADRs → Implementation.

**Source:** `documentation-governance-framework.md` §1a.

### AGR-004 — API Schema First

Application code consumes the `api` schema exclusively. Direct access to a business schema is permitted only as an explicit, narrowly-bounded exception, cited to the specific architecture document that authorizes it, and logged in the technical debt register.

**Source:** `backend-architecture.md`. Demonstrated by TD-001 (`identity.*` in the Authentication Service) and TD-002 (`analytics.analytics_events` in the notification job) — both bounded to a single file each, both cited to their authorizing document, neither silent.

### AGR-005 — RLS Is the Final Authority

Row Level Security is the platform's actual authorization boundary. Application- and service-layer checks are advisory only (UX, defense-in-depth) and are never treated as a substitute.

**Source:** `authentication-architecture.md`'s "Authorization Model." Verified at every implementation step by confirming no service reimplements an authorization decision RLS already makes.

### AGR-006 — Open ADRs Are Never Assumed Resolved

Implementation must not build, expose, or imply the outcome of any pending ADR.

**Source:** Demonstrated by Step 8 (no cooldown data exposed to creators, ADR-013), Step 9 (leaderboard reads stay RLS-scoped rather than widened, ADR-014; reputation scores structurally marked `isProvisional`, ADR-015), and Step 12 (Flutterwave crediting deferred entirely rather than worked around, ADR-017).

### AGR-007 — New Architecture Requires an ADR, Not a Workaround

If closing a gap would require a new migration, a new schema object, or a materially new pattern, it is proposed as an ADR — never implemented as an application-layer workaround.

**Source:** `phase-5-roadmap.md` Step 12's own Dependencies clause, cited verbatim when Flutterwave credit-purchase crediting was deferred rather than worked around with a direct table write.

---

# Engineering Principles (EPR)

### EPR-001 — Thin Service Principle

Domain services are thin, typed wrappers around exactly the `api.*` objects their domain owns. No orchestration logic, no reimplementation of a business rule the database already enforces.

**Source:** `service-architecture.md`. Re-verified with zero exceptions across all ten domain services during the Phase 5 Final Acceptance Audit.

### EPR-002 — Domain Ownership

Each domain owns exactly one schema/service pairing. No domain reads another domain's schema directly or calls another domain's internals. Cross-domain reuse happens through an explicit, documented re-export — never a duplicate implementation.

**Source:** `domain-architecture.md`. Demonstrated by the Payment Domain importing Intelligence's `createPerformanceBonus()` rather than re-wrapping the same procedure.

### EPR-003 — Intentional Infrastructure Must Be Documented as Such

Code built ahead of its consumer (e.g. Storage/AI clients in Step 2, the Authentication Service in Step 3) is acceptable — but must be labeled in-file as intentionally unconsumed, and why, so it is never mistaken for an oversight or dead code.

**Source:** The TD-004 evidence-based reclassification, which distinguished "intentional future infrastructure" from "incomplete deliverable" precisely because the former was — after this rule was applied retroactively — documented in-file, and the distinction was verifiable against the approved roadmap rather than asserted.

### EPR-004 — Fail Closed

Any authentication, authorization, or session-resolution failure defaults to denial or `null`, never to an assumed-valid state.

**Source:** `authentication-architecture.md`'s Security Principles. Verified by unit tests exercising the null/invalid-session path in every auth-adjacent function, not just the success path.

### EPR-005 — Use Existing Utilities Exactly as Designed

A fix or improvement uses the tools already built for that purpose, unchanged in shape, rather than introducing a parallel mechanism or a new framework.

**Source:** Demonstrated resolving TD-003 — observability was wired into every critical mutating operation using the existing `logger`/`audit`/`metrics`/`tracing` utilities verbatim, with no new logging library introduced and no change to any function's signature or error-throwing contract.

### EPR-006 — No Unapproved Vendor Decisions

Where an external integration is not yet architecturally approved (email provider, monitoring platform, AI provider), build a vendor-neutral interface with honest "not configured" behavior rather than picking a vendor unilaterally or faking a working integration.

**Source:** `app/notifications/email-provider.ts`, `app/ai/client.ts` — both `isConfigured()`-gated stubs, neither pretending to be a real integration.

### EPR-007 — Fix Cross-Cutting Failures With a Shared Mechanism, Never a Per-Route Patch

When a defect spans multiple routes or domains, audit the actual failure surface across all of them before designing the fix, and implement the correction once, in the shared layer — never as a special case in the one route that happened to surface it. Prefer a typed, explicit escape hatch for future code over fragile pattern-matching, but don't retrofit working, already-tested code just to use it — a generic fallback for the existing behavior is legitimate when the pattern is verified consistent across multiple, unrelated call sites.

**Source:** TD-005's resolution (Phase 6 EWP-002 hardening) — a full audit of every exception raised across two domains (Campaign, Intelligence) found one 100%-consistent admin-check convention and one 100%-consistent not-found convention, both handled by a single classifier added to `app/api/_lib/errors.ts`. No domain service was modified.

---

# Development Standards (DSR)

### DSR-001 — Strict TypeScript, No `any` in Production Code

`strict: true` and `noUncheckedIndexedAccess: true` are non-negotiable. `any` is permitted only inside test-mock infrastructure, never in `app/`.

**Source:** `tsconfig.json`. Verified by a zero-result grep for `any` across `app/` during the Final Acceptance Audit.

### DSR-002 — Consistent Naming

Exported service functions follow a verb-first convention (`get`/`list`/`create`/`award`/`revoke`/`recalculate`/`distribute`/`rotate`, etc.) so a function's effect is legible from its name alone, without needing to read its body.

**Source:** Verified across all exported service functions with zero naming inconsistencies found.

### DSR-003 — Migrations Are Forward-Only

A previous migration is never edited. A correction is always a new migration.

**Source:** `CLAUDE.md`'s Migration Rules. Demonstrated when the Payment Credit Pipeline gap was routed to ADR-017 for a future migration rather than editing migration 008 to add the missing procedure.

### DSR-004 — `service_role` Never in Client-Reachable Code

Verified, not assumed, at every step: by source grep for `service_role`/`SUPABASE_SERVICE_ROLE_KEY`/`createSupabaseServiceClient`, and by grepping the actual built client bundle (`.next/static`) after `npm run build`.

**Source:** `authentication-architecture.md`'s Security Principles. The verification *method* — checking the real build artifact, not just the source — is itself part of the standard.

### DSR-005 — Consistent Error-Handling Contract

Read operations return `null`/empty on failure. Mutating operations throw. No function mixes the two conventions.

**Source:** Verified across every domain service during the Final Acceptance Audit by listing every `throw` site and confirming each sits inside a mutating function.

---

# Quality Gate Rules (QGR)

### QGR-001 — Compile, Build, Test Before Advancing

No implementation step is marked complete until it typechecks, builds, and — once a test suite exists — passes tests.

**Source:** The per-step gating discipline applied to all 15 Phase 5 roadmap steps.

### QGR-002 — Architecture Compliance Review + Security Review Per Step

Every step's completion includes an explicit Architecture Compliance Review and Security Review, not just passing automated checks.

**Source:** Phase 5's Step Completion Log (`phase-5-roadmap.md`).

### QGR-003 — Verify, Don't Assume

Claims about the codebase — a file exists, a grep returns clean, a build succeeds — are established by actually running the check in the current session, not recalled from memory or asserted from a prior turn or a tool's summary.

**Source:** Demonstrated when a backgrounded `npm install` was reported by the harness as exit code 0, but reading the actual raw output showed an `ECONNRESET` failure partway through — caught only because the raw log was read directly rather than trusting the summary.

### QGR-004 — Documentation Must Match Implementation Before Sign-Off

A step or phase is not complete if its own governing document contradicts itself (header vs. footer) or contradicts a sibling document.

**Source:** The `phase-5-roadmap.md` self-contradiction (header: "Status: ACTIVE"; footer: "Status: COMPLETE") found and fixed during the Phase 5 Final Acceptance Audit.

### QGR-005 — Findings Are Classified by Severity, Not Rounded to a Preferred Outcome

Compliance/audit reviews classify each finding (Critical / Major / Minor / Cosmetic), and the resulting proceed/stop decision follows a predefined rule tied to that classification — not a discretionary judgment call made after the fact.

**Source:** The refined Chief Architect Acceptance Audit framework adopted for Phase 5's freeze decision, which explicitly overrode a more permissive initial recommendation once the stricter, predefined rule was applied.

### QGR-006 — Integration Tests Are a Per-Endpoint Deliverable, Not Deferred

Every new API route ships, as part of the same work package that introduces it, with: unit tests for any new logic, an integration test under `backend/tests/integration/api/` exercising the complete HTTP request lifecycle for that route, and documentation updates reflecting the new endpoint or any architectural clarification it required. None of the three is deferred to a later "testing phase" — the route is not done until all three exist.

**Source:** Founder's Phase 6 Testing Directive, 2026-07-17, issued before EWP-002 (the first domain-endpoint work package) began, specifically to prevent Phase 5's own pattern — a dedicated Testing step (Step 14) arriving after implementation (Steps 1-13) — from repeating at the per-endpoint level in Phase 6.

---

# Amendment Process

Adding, retiring, or superseding a rule in this document is itself governed by AGR-001 and AGR-002: propose the change, review it against existing rules for conflicts, record it here with a new (never reused) identifier or an explicit "superseded by" note, before any implementation relies on the change.

---

# Document Status

```text
Document:
docs/engineering-principles.md

Hierarchy Level:
Level 1 — Project Governance (Live)

Rules recorded:
7 AGR, 7 EPR, 5 DSR, 6 QGR (25 total)

Status:
ACTIVE

Effective:
2026-07-17
```
