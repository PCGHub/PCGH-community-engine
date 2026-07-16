# Discovery Domain — Models

Owns: `discovery` schema (discovery_opportunities, community_assignments, member_assignments, assignment_history).

Uses: `api.discovery_summary_view`.

Source: `docs/discovery-schema.md`, `docs/domain-architecture.md` ("Discovery Domain").

Populated by Campaign Domain's `api.distribute_campaign()` — Discovery Domain reads and reports; it does not initiate distribution.

No logic here — type definitions only. See `app/services/discovery/` for the Discovery Domain Service.
