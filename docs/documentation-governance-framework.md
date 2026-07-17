# PCGH Documentation Governance Framework

## Hierarchy Level

Level 1 — Project Governance

## Status

ACTIVE

## Phase

Phase 2 — Implementation

---

# Purpose

This document is the authoritative governance guide for all PCGH project documentation.

It defines which documents govern the project, which are authoritative for implementation, which are conceptual, which are historical, and how conflicts between them are resolved.

This framework does not redesign the platform, change any locked architecture, or renumber project phases. It governs documents, not business logic.

Every statement in this framework is sourced from a decision already approved elsewhere in the project. Where no prior decision exists, this document says so explicitly rather than inventing one.

---

# 1. Documentation Hierarchy

Documents are organized into five levels. A document's level determines its authority, not its age or length.

```text
LEVEL 1 — Project Governance (Live)

CLAUDE.md
implementation-rules.md
architecture-decisions.md
IMPLEMENTATION_STATUS.md
phase-2-roadmap.md
documentation-governance-framework.md (this document)
implementation-playbook.md (Phase 4 coding governance)
engineering-principles.md (permanent AGR/EPR/DSR/QGR rule register,
                           effective 2026-07-17)

------------------------------------------------

LEVEL 2 — Architecture (Live, some entries incomplete)

vision.md
business-model.md
architecture.md
database-architecture.md
system-flow.md            [placeholder — see Section 9]
security.md                [placeholder — see Section 9]
api-specification.md       [placeholder — see Section 9]
database-schema.md         [placeholder — see Section 9]
phase-4-kickoff.md
phase-5-roadmap.md
application-architecture-freeze.md
backend-architecture.md
authentication-architecture.md
service-architecture.md
domain-architecture.md
frontend-architecture.md

------------------------------------------------

LEVEL 3 — Implementation Specifications (Authoritative for build)

identity-schema.md
economy-schema.md
discovery-schema.md
protection-schema.md
intelligence-schema.md
analytics-schema.md
governance-schema.md
api-schema.md
seed-data.md

------------------------------------------------

LEVEL 4 — Conceptual References (Non-authoritative for implementation)

identity-engine.md
community-engine.md
creator-circle-engine.md
credit-engine.md
campaign-engine.md
distribution-engine.md
discovery-assignment-engine.md
rotation-engine.md
reputation-engine.md
recognition-engine.md
analytics-engine.md
platform-governance-engine.md
creator-discovery.md
audience-amplification.md
feature flag engine.md     [placeholder]
audience Matching Engine   [placeholder]
technical-debt.md          [non-authoritative engineering reference]

------------------------------------------------

LEVEL 5 — Historical Documents (Point-in-time records)

phase-1-completion.md
phase-2-step-1-database-architecture.md
project-handoff-phase-2.md
database-implementation-complete.md
phase-4-completion.md      [added retroactively -- was already
                           Level 5 per its own header, missing
                           from this index]
phase-5-completion.md
roadmap.md                 [placeholder]
```

**Precedence rule:** when two documents describe the same thing differently, the document in the lower-numbered level governs. Level 3 (Implementation Specifications) is always authoritative over Level 4 (Conceptual References) for anything touching production database structure. Level 1 governs Level 2 through 5. This resolves the Engine-vs-Schema conflicts identified in the most recent architectural review without requiring any document to be rewritten immediately.

## 1a. Documentation Authority Order

This section is the single, consolidated statement of document precedence for the whole project. Any other document that previously stated its own precedence list (e.g. `phase-4-kickoff.md`'s "Documentation Governance" principle) now defers to this section rather than restating it, to prevent the two from drifting apart the way they previously did.

### Level 1 internal precedence

Level 1 contains multiple governance documents. Among them, authority is ordered as follows:

```text
Implementation Rules
        ↓
Documentation Governance Framework
        ↓
CLAUDE.md
        ↓
Implementation Playbook
        ↓
Engineering Principles (AGR/EPR/DSR/QGR)
```

If `implementation-rules.md`, this framework, `CLAUDE.md`, `implementation-playbook.md`, and `engineering-principles.md` disagree, the higher document in this order takes precedence. `architecture-decisions.md`, `IMPLEMENTATION_STATUS.md`, and `phase-2-roadmap.md` are not part of this internal ordering — they record decisions and status rather than asserting rules, so they do not compete for precedence with the five rule-making documents above. `engineering-principles.md` sits last among them because it codifies granular engineering/quality-gate practice already implied by the other four, rather than asserting new project-level or architectural authority.

This order does not, by itself, change any existing phase numbering or document content. It only establishes which document wins if such a conflict is ever formally invoked. See Section 7 for how this applies to the currently logged `CLAUDE.md` / `implementation-rules.md` phase-model disagreement.

### Full authority order (across all levels)

Extending the Level 1 internal order above down through the rest of the hierarchy:

```text
implementation-rules.md
        ↓
documentation-governance-framework.md
        ↓
CLAUDE.md
        ↓
implementation-playbook.md
        ↓
engineering-principles.md
        ↓
Architecture documents (Level 2)
        ↓
Schema documents (Level 3)
        ↓
architecture-decisions.md (ADRs)
        ↓
Implementation (migrations, application code)
```

This full order governs *sequencing and rule-making authority* end to end; it does not override the simpler Level-based precedence rule already stated above ("the document in the lower-numbered level governs") — it refines what happens *within* and *below* Level 1, and clarifies where ADRs and actual implementation sit relative to documentation. A Level 2 architecture document (e.g. `backend-architecture.md`, `authentication-architecture.md`, `service-architecture.md`, `domain-architecture.md`, `application-architecture-freeze.md`, `phase-5-roadmap.md`, `phase-4-kickoff.md`) is always subordinate to any Level 1 document under both statements of the rule.

---

# 2. Engine vs Schema Responsibilities

```text
Engine Documents

Describe business concepts, philosophy, and rules.

Never define production tables.

Never treated as an implementation specification.
```

```text
Schema Documents

Define production database structures: tables, columns,
constraints, indexes, relationships, and RLS.

Always authoritative for implementation.
```

Where an Engine document and a Schema document describe the same table differently (for example, differing field names for `feature_flags`, `governance_rules`, or the badge model), the Schema document is correct. The Engine document's version is retained as historical business-concept context only and carries no implementation weight.

This rule is a direct adoption of the review finding and the Product Owner–approved resolution discussed for the Documentation Governance Freeze.

---

# 3. Legacy Documentation Policy

Legacy documents (Level 4 and Level 5) are never deleted.

They are retained because they capture the original business reasoning and philosophy behind the platform, which remains valuable context even after the physical schema has superseded their table definitions.

Policy:

```text
Legacy documents are preserved, not deleted.

Legacy documents are marked with their Level and,
where a superseding document exists, a pointer to it.

Legacy documents are never cited as the source of
truth for implementation.
```

Applying the "Superseded by" marker to each individual Level 4 document is a follow-on documentation task, not performed by this framework. This framework establishes the policy; it does not yet apply the markers.

---

# 4. Document Lifecycle

Every document in the project moves through the following states:

```text
DRAFT
   ↓
ACTIVE / LOCKED
   ↓
SUPERSEDED
   ↓
HISTORICAL
```

- **DRAFT** — under construction, not yet authoritative.
- **ACTIVE** — currently maintained and expected to change as the project progresses (e.g. `IMPLEMENTATION_STATUS.md`, `phase-2-roadmap.md`).
- **LOCKED** — architecturally frozen; changes require the Conflict Resolution Process in Section 7 (e.g. the schema documents).
- **SUPERSEDED** — replaced by a newer document for implementation purposes, but retained for context (the Level 4 engine documents, once marked).
- **HISTORICAL** — a point-in-time record of a completed step or handoff; not updated to reflect new decisions except for factual corrections (e.g. `phase-1-completion.md`, `project-handoff-phase-2.md`).

A document must always declare its current state. A document with no declared state is treated as DRAFT and carries no authority until classified.

---

# 5. Architecture-First Development Workflow

PCGH follows a single approved implementation workflow, already established in `docs/phase-2-roadmap.md`:

```text
Design
    ↓
Approve
    ↓
Implement
    ↓
Review
    ↓
Deploy
```

No implementation work (schema, migration, API, service, or dashboard) begins without a corresponding Level 3 (or, for future domains, newly approved) design document. This is the same rule already stated in `CLAUDE.md` ("Architecture First. Implementation Second.") and `implementation-rules.md` ("Implement. Do not redesign.").

## 5a. Architecture Change Lifecycle

Every new or changed architectural decision — not only conflicts — follows this lifecycle before implementation begins:

```text
Proposal
    ↓
Architecture Review
    ↓
ADR
    ↓
Documentation Update
    ↓
Implementation
```

- **Proposal** — a change is proposed by the Chief Architect, or raised by the Chief Engineer via the STOP → DOCUMENT steps of the Conflict Resolution Process (Section 7) if it surfaces during implementation.
- **Architecture Review** — the Chief Architect evaluates the proposal against the locked architecture and this framework's precedence rules (Sections 1, 1a, 2). Disagreement escalates to the Founder per the Governance Hierarchy (Section 6).
- **ADR** — once approved, the decision is recorded as a new entry in `architecture-decisions.md`, following its existing entry format (Decision, source, and rationale where relevant). No decision is treated as approved until it has an ADR entry.
- **Documentation Update** — the affected Level 2 or Level 3 document is updated to reflect the now-approved decision, per the Document Lifecycle (Section 4) and the Engine vs. Schema rule (Section 2).
- **Implementation** — the Chief Engineer implements strictly from the updated document, per the Documentation Ownership rules (Section 12), entering the Architecture-First Development Workflow above (Design → Approve → Implement → Review → Deploy).

This lifecycle governs how a decision is made and documented; the workflow above governs how the resulting build work is carried out once Documentation Update is complete. The two are sequential, not competing — the Architecture Change Lifecycle ends where the Architecture-First Development Workflow begins.

---

# 6. Architectural Governance Roles

Roles are as already defined in `docs/phase-2-roadmap.md` and `docs/project-handoff-phase-2.md`:

```text
Product Owner
Victor Nonso Fidelis (PCGH Founder)

Chief Architect
ChatGPT
  - Architecture
  - Database Design
  - Security Design
  - Governance
  - Scalability
  - Review

Chief Engineer
Claude Code
  - Database Implementation
  - Backend Development
  - API Development
  - Dashboard Development
  - Refactoring
  - Optimization
```

**Governance hierarchy (resolved):**

```text
Founder
   ↓
Chief Architect
   ↓
Chief Engineer
```

The Founder holds final decision authority over the entire project. The Chief Architect holds authority over architecture, database design, security design, governance, and scalability questions, subject to Founder approval. The Chief Engineer holds authority over implementation, subject to both Chief Architect and Founder approval. When the Chief Architect and Chief Engineer disagree on any documentation or architecture question, the matter escalates to the Founder, whose decision is final. This closes the tie-breaking gap previously logged as an open item.

---

# 7. Conflict Resolution Process

For conflicts already covered by the precedence rule in Section 1 (Engine vs. Schema), no escalation is needed — the Schema document governs automatically.

For conflicts between the Chief Architect and the Chief Engineer, the Governance Hierarchy in Section 6 applies: escalate to the Founder, whose decision is final.

For all other conflicts (a Level 1 document disagreeing with another Level 1 document, an ambiguous Level 2 gap, or any case with no established precedence), PCGH follows the procedure already approved in `docs/implementation-rules.md`:

```text
STOP
    ↓
DOCUMENT
    ↓
PROPOSE
    ↓
WAIT FOR APPROVAL
    ↓
IMPLEMENT
```

Never redesign or reclassify a document silently.

**Documentation authority order (resolved):** where `CLAUDE.md`, `implementation-rules.md`, or this framework disagree with one another, the Documentation Authority Order defined in Section 1a governs which document's version applies. `CLAUDE.md` and `docs/implementation-rules.md` currently still describe the project's phase structure differently (a 3-phase model vs. a 2-phase model); the Documentation Authority Order determines that `implementation-rules.md` governs that specific disagreement. Per the Founder's standing instruction, no phase numbering is being changed as part of this framework — the authority order is established now so that if and when the conflict is formally revisited, it is resolved by rule rather than ad hoc.

---

# 8. Documentation Governance Rules

```text
Every document must declare its Hierarchy Level.

Every document must declare its Status
(DRAFT, ACTIVE, LOCKED, SUPERSEDED, or HISTORICAL).

Schema documents are always authoritative over Engine
documents for implementation purposes.

No document may declare LOCKED status without
Product Owner approval.

Historical documents are not edited to reflect new
decisions. Factual corrections (e.g. a stale table name)
are permitted; scope or decision changes are not.

Conflicts follow the Conflict Resolution Process
in Section 7.

New documentation must state its Hierarchy Level at
creation, not after the fact.

No document may be silently deleted. Retirement is a
Status change (HISTORICAL or SUPERSEDED), not removal.
```

---

# 9. Placeholder Document Policy

A placeholder document (a file that exists but contains no real content) may not remain in that state indefinitely. Each placeholder must eventually be either:

```text
POPULATED
using already-locked material as source, or

RETIRED
formally marked HISTORICAL or removed from the
active hierarchy, with the decision recorded in
architecture-decisions.md
```

Known placeholders as of this document's creation:

```text
docs/system-flow.md
docs/security.md
docs/api-specification.md
docs/database-schema.md
docs/roadmap.md
docs/feature flag engine.md
docs/audience Matching Engine
```

Per the Documentation Governance Freeze discussion, these are intentionally left unresolved by this framework. The agreed sequencing is: complete the Documentation Governance Freeze first, then populate or retire each placeholder using the locked schema and architecture documents as source material — not before, and not as an emergency backfill.

---

# 10. Scope Boundaries for Future Implementation Architecture

The following concerns were identified during architectural review as real gaps, but are explicitly out of scope for this framework and for the current Phase 2/Phase 3 documentation set:

```text
Observability and monitoring architecture

API rate limiting / abuse prevention

Deployment topology and environment/secrets strategy

Data retention and archival policy (beyond what is
already stated per-schema, e.g. Analytics partitioning)

Automated testing strategy for migrations and services
```

These belong to a future "Implementation Architecture" documentation set, to be created once Backend Services and the API layer move from design to build. Including them prematurely here would expand this framework beyond documentation governance into implementation design, which is not its purpose.

---

# 11. Documentation Review Checklist

Before any document is added, edited, or reclassified, verify:

```text
[ ] Hierarchy Level is declared

[ ] Status is declared (DRAFT / ACTIVE / LOCKED /
    SUPERSEDED / HISTORICAL)

[ ] If the document describes a database table, it does
    not conflict with the corresponding Level 3 schema
    document — or, if it does, it is Level 4 and marked
    accordingly

[ ] If superseding another document, the superseded
    document is marked with a pointer to this one

[ ] No locked schema document has been modified without
    following the Conflict Resolution Process (Section 7)

[ ] Any new architectural decision is recorded in
    architecture-decisions.md, not only in the document
    itself

[ ] Phase numbering is unchanged unless the Product
    Owner has explicitly approved a renumbering

[ ] No SQL or business logic has been invented to fill
    a documentation gap
```

---

# 12. Documentation Ownership

Ownership follows the Governance Hierarchy in Section 6 (Founder → Chief Architect → Chief Engineer). "Owns" means holds primary authorship/decision authority for changes; it does not mean exclusive editing access.

```text
Governance Documents
(CLAUDE.md, implementation-rules.md,
 documentation-governance-framework.md,
 architecture-decisions.md)

Owner: Founder
Maintained by: Chief Architect
Final approval: Founder
```

```text
Architecture Documents
(vision.md, business-model.md, architecture.md,
 database-architecture.md, system-flow.md,
 security.md, api-specification.md,
 database-schema.md)

Owner: Chief Architect
Approved by: Founder
Implemented from by: Chief Engineer
```

```text
Schema Documents
(identity-schema.md, economy-schema.md,
 discovery-schema.md, protection-schema.md,
 intelligence-schema.md, analytics-schema.md,
 governance-schema.md, api-schema.md, seed-data.md)

Owner: Chief Architect
Locked by: Founder approval
Implemented by: Chief Engineer, without design
authority — deviations follow the Conflict
Resolution Process in Section 7
```

```text
SQL Migrations
(supabase/migrations/*.sql)

Owner: Chief Engineer
Must conform to: the corresponding Level 3
schema document, without exception
Design changes: not permitted at the migration
level — any needed design change starts at the
schema document, not the migration file
```

```text
Roadmaps
(phase-2-roadmap.md, IMPLEMENTATION_STATUS.md)

Owner: Founder (scope, priority, phase structure)
Updated by: Chief Architect and Chief Engineer
(progress and status only)
Phase renumbering: requires explicit Founder
approval; neither Chief Architect nor Chief
Engineer may renumber phases unilaterally
```

---

# Framework Status

```text
Document:
docs/documentation-governance-framework.md

Hierarchy Level:
1

Entries classified:
Level 1: 8
Level 2: 16 (4 placeholder)
Level 3: 9
Level 4: 17 (2 placeholder)
Level 5: 7 (1 placeholder)

Documentation authority order:
Extended to a full, consolidated cross-level order
(Section 1a) -- absorbs the precedence list previously
duplicated in phase-4-kickoff.md

Governance hierarchy:
Founder -> Chief Architect -> Chief Engineer
(resolved)

Documentation authority order:
Implementation Rules -> Documentation Governance
Framework -> CLAUDE.md
(resolved)

Architecture Change Lifecycle:
Proposal -> Architecture Review -> ADR ->
Documentation Update -> Implementation
(documented, Section 5a)

Open items logged:
1 (specific phase-model wording in CLAUDE.md
   vs. implementation-rules.md remains
   unreconciled; the authority order to resolve
   it, if invoked, is now established)

Status:
ACTIVE
```
