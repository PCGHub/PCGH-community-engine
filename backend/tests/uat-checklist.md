# User Acceptance Test Checklist

Manual checklist for Phase 5 Step 14. Not automatable -- requires a human reviewer against a running instance with a live Supabase project and real session data. Not executed by this engagement; provided for the Founder/QA to run.

## Admin Dashboard (`/admin`)

```text
[ ] Signed-in administrator sees feature flags, system settings,
    governance rules, and AI controls
[ ] Signed-in non-administrator sees the "administrator-only" empty
    state, not an error, not partial data
[ ] Signed-out visitor sees the "sign in" empty state
```

## Creator Dashboard (`/creator`)

```text
[ ] Signed-in creator sees their own profile, wallet balance,
    reputation scores, campaign stats, and earned badges
[ ] A creator with zero badges sees "No badges earned yet," not an
    empty list with no explanation
[ ] Signed-out visitor sees the "sign in" empty state
```

## Community Dashboard (`/community`)

```text
[ ] Visible communities render with member count, reputation,
    active campaigns, and engagement stats
[ ] historicalPerformance renders as a list for an administrator,
    and as the "not available" empty state for a non-admin,
    non-owning viewer -- never a fabricated value
[ ] A viewer with no visible communities sees the "no communities
    visible" empty state
```

## Analytics Dashboard (`/analytics`)

```text
[ ] Signed-in administrator sees platform-wide totals (users,
    creators, communities, campaigns, credits, discovery stats,
    average reputation scores)
[ ] Signed-in non-administrator sees the "administrator-only" empty
    state
```

## Cross-cutting

```text
[ ] Navigation bar links to all four dashboards from every dashboard
[ ] No dashboard ever displays a service_role-derived value or a
    raw database error message
[ ] Reputation scores are presented as provisional, not final
    (ADR-015 open)
[ ] No dashboard exposes a cross-user reputation ranking to a
    non-administrator (ADR-014 open)
```
