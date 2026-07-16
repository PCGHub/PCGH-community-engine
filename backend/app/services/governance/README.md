# Governance Service (Domain)

Feature flags, system settings, governance rules, AI controls, administrative overrides. Calls `api.is_feature_enabled()` and `api.platform_configuration_view` (administrator-only). The single owner of feature-flag checks — no other service maintains its own copy. See `docs/service-architecture.md` and `../README.md`.
