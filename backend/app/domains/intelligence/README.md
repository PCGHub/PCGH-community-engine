# Intelligence Domain — Models

Owns: `intelligence` schema (member_reputation, creator_reputation, community_reputation, badges, user_badges, performance_bonus, performance_bonus_members, achievement_history).

Uses: `api.badges_view`, `api.reputation_leaderboard_view`, `api.award_badge()`, `api.revoke_badge()`, `api.calculate_member_reputation()`, `api.calculate_creator_reputation()`, `api.calculate_community_reputation()`, `api.create_performance_bonus()` (shared with Payment Domain).

Source: `docs/intelligence-schema.md`, `docs/domain-architecture.md` ("Intelligence Domain").

Reputation-scoring formulas are documented placeholders pending `ADR-015` — never present as final in user-facing copy. `api.reputation_leaderboard_view` is admin-only in practice pending `ADR-014`.

No logic here — type definitions only. See `app/services/intelligence/` for the Intelligence Domain Service.
