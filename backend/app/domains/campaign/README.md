# Campaign Domain — Models

Owns: `economy.campaigns`, `economy.campaign_asset`, `economy.campaign_distributions` (the campaign-related subset of the Economy schema — see `docs/domain-architecture.md` for the full Economy split with Payment Domain).

Uses: `api.campaign_summary_view`, `api.distribute_campaign()`, `api.rotate_campaign()`, `api.close_campaign()`, `api.archive_campaign()`, `api.restore_campaign()`, `api.calculate_campaign_performance()`.

Source: `docs/economy-schema.md`, `docs/domain-architecture.md` ("Campaign Domain").

No logic here — type definitions only. See `app/services/campaign/` for the Campaign Application Service.
