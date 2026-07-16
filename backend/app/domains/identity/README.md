# Identity Domain — Models

Owns: `identity` schema (users, user_roles, creator_circles, creator_circle_members, member_communities, member_community_members, community_member_history).

Uses: `api.creator_dashboard_view`, `api.member_dashboard_view` (profile fields only).

Source: `docs/identity-schema.md`, `docs/domain-architecture.md` ("Identity Domain").

No logic here — type definitions only. See `app/services/identity/` for the Identity Domain Service.
