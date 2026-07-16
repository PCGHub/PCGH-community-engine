# Protection Domain — Models

Owns: `protection` schema (rotation_history, community_cooldowns, member_cooldowns, community_exclusions, community_performance_history).

Uses: `api.creator_protection_view`, `api.is_creator_on_cooldown()`.

Source: `docs/protection-schema.md`, `docs/domain-architecture.md` ("Protection Domain").

`api.creator_protection_view` deliberately omits cooldown status for creators, pending `ADR-013` — this is not to be worked around at the domain level. Cooldown enforcement is centralized inside `api.distribute_campaign()`; Protection Domain does not re-check cooldowns independently.

No logic here — type definitions only. See `app/services/protection/` for the Protection Domain Service.
