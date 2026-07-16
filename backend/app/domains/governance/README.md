# Governance Domain — Models

Owns: `governance` schema (feature_flags, system_settings, governance_rules, admin_overrides, platform_experiments, ai_controls).

Uses: `api.is_feature_enabled()`, `api.platform_configuration_view` (administrator-only).

Source: `docs/governance-schema.md`, `docs/domain-architecture.md` ("Governance Domain").

Every other domain calls `api.is_feature_enabled()` for feature gating — Governance Domain is the single owner of that check; no other domain maintains its own copy of feature-flag state.

No logic here — type definitions only. See `app/services/governance/` for the Governance Domain Service.
