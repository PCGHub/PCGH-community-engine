# app/storage/ — Storage Service (Infrastructure)

Uploads, media, and asset management. Owns no business schema — consumed by domains that need to attach media (e.g. `economy.campaign_asset`'s `content_url`/`thumbnail_url`), but does not itself own campaign, identity, or any other business data (`docs/service-architecture.md`, "Infrastructure Services").
