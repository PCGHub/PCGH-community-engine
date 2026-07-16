# Intelligence Service (Domain)

Reputation, badges, achievements, bonus orchestration. Calls `api.badges_view`, `api.award_badge()`, `api.revoke_badge()`, the `api.calculate_*_reputation()` functions, and `api.reputation_leaderboard_view`. Reputation scores are placeholders pending `ADR-015`; the leaderboard is admin-only pending `ADR-014`. See `docs/service-architecture.md` and `../README.md`.
