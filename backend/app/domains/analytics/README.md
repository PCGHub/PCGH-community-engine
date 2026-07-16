# Analytics Domain — Models

Owns: `analytics` schema (member_analytics, community_analytics, creator_analytics, platform_analytics, analytics_events, analytics_reports).

Uses: `api.platform_statistics_view` (administrator-only), `api.community_dashboard_view`.

Source: `docs/analytics-schema.md`, `docs/domain-architecture.md` ("Analytics Domain").

Analytics is a rollup layer, not a source of truth (`ADR-008`) — this domain does not recompute business facts owned by another domain; it aggregates them.

No logic here — type definitions only. See `app/services/analytics/` for the Analytics Domain Service.
