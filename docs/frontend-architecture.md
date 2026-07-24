# Frontend Architecture

Status:
✅ LOCKED — approved by the Founder, 2026-07-16, with the Navigation
Strategy and Dashboard Data Flow refinements incorporated.

Phase:
Phase 5 — Application Implementation

Hierarchy Level:
Level 2 — Architecture

---

# Purpose

This document defines how the PCGH frontend is structured: layout hierarchy, navigation strategy, which dashboard owns which `api.*` object, the data flow from page to database, shared component architecture, the design system, responsive strategy, and UI composition rules.

It governs Phase 5 Step 13 (Frontend Integration) and any frontend work after it. It does not redefine authentication, authorization, or data access — those remain owned by `docs/authentication-architecture.md` and the "API Schema First" principle in `docs/backend-architecture.md`. This document is scoped to presentation structure only.

Per `docs/implementation-playbook.md`'s Frontend Rules (`CLAUDE.md`, "Frontend"): React, TypeScript, Tailwind, reusable components, no duplicated UI. This document is how those five rules are applied concretely.

---

# Scope

In scope:

```text
Layout hierarchy (root layout, dashboard layout, page shell)
Navigation strategy (principles, not a fixed link set or layout)
Dashboard ownership (which api.* object backs which dashboard)
Dashboard data flow (page -> Domain Service -> api schema ->
  business schema -> RLS)
Shared component architecture (app/components/)
Design system (Tailwind conventions)
Responsive strategy
UI composition rules (Server vs. Client Components, where
  data-fetching lives, how RLS-null states are rendered)
```

Out of scope (unchanged by this document):

```text
Authentication/session mechanics -- docs/authentication-architecture.md
Authorization -- Row Level Security, always the final boundary
Which api.* views/functions exist -- docs/api-schema.md,
  docs/domain-architecture.md
Role-based navigation filtering -- not decided here (Section 2);
  every dashboard link is presented to every viewer until a
  future revision explicitly addresses this
```

---

# 1. Layout Hierarchy

```text
app/layout.tsx (Root Layout)
  -- html/body shell, imports app/globals.css (Tailwind), no
     business logic, no navigation chrome of its own.
       │
       ▼
app/(dashboards)/layout.tsx (Dashboard Layout)
  -- shared chrome for every dashboard route: navigation
     (implementing the principles in Section 2) and consistent
     outer spacing. Wraps /admin, /creator, /community, /analytics
     via a Next.js App Router route group -- the route group
     changes no URL path, it only lets these four routes share one
     layout without forcing every future route (e.g. a future
     login page) through the same chrome.
       │
       ▼
DashboardShell (per-page component, app/components/DashboardShell.tsx)
  -- page-level heading and content container. Composed inside
     each dashboard page, not a Next.js layout file itself,
     because it needs a per-page title prop.
       │
       ▼
Page content (StatCard grids, EmptyState, page-specific sections)
```

Three levels, each with one job: Root Layout (document shell), Dashboard Layout (cross-dashboard chrome), DashboardShell (per-page heading/container). No level duplicates another's responsibility.

---

# 2. Navigation Strategy

This section defines the principles navigation must follow, not a fixed set of links or a specific visual layout. The concrete navigation UI is an implementation detail of `app/(dashboards)/layout.tsx` (Section 1) and may change as dashboards are added, renamed, or reorganized, without requiring a new architecture revision -- provided it still satisfies the principles below.

```text
Navigation reflects Dashboard Ownership (Section 3): one entry
  point per dashboard, never more than one route to the same
  api.* read, never a link to a dashboard that doesn't exist in
  Section 3's table.

Navigation is structural chrome, not business logic. It lives in
  the Dashboard Layout (Section 1) as presentation only -- it
  never fetches data, never resolves a session, and never imports
  a Domain Service (Section 4) or the api schema directly.

Navigation never duplicates an authorization decision. Each
  destination page owns its own RLS-driven empty/unauthorized
  state (Section 8) -- navigation does not decide, hide, or
  filter based on who can see what. If a viewer cannot see a
  dashboard's data, that is discovered on the page, not withheld
  at the navigation layer.

Navigation is plain, static routing (Next.js <Link>) -- no
  separate client-side nav store, no client-fetched permissions
  list, no navigation-specific state management.

Role-based link visibility is explicitly deferred, not decided
  here. If introduced later, it must read the same already-
  resolved role data the pages themselves use (Step 3's Role
  resolver), never a separate frontend-only permission list --
  per docs/authentication-architecture.md's "Permission
  Resolution" (no separate permission cache). Until then, every
  dashboard link is presented to every viewer.
```

---

# 3. Dashboard Ownership

Each dashboard owns exactly one primary `api.*` read (per `docs/implementation-playbook.md`'s Frontend Rules: "Dashboards consume `api.*` views for reads, matching each dashboard's documented data"):

```text
Admin Dashboard       -> api.platform_configuration_view
                         (administrator-only), served by the
                         Governance Service (Phase 5 Step 5).
                         Configuration/governance surface:
                         feature flags, system settings,
                         governance rules, AI controls.

Creator Dashboard     -> api.creator_dashboard_view (full),
                         read by a page-local reader
                         (app/creator/data.ts), not an existing
                         domain service. docs/domain-architecture.md
                         marks this view "Cross-domain (no single
                         owner)" -- Identity Service's
                         getCreatorProfile() intentionally reads
                         only the profile-field slice it owns, so
                         a page-local reader covers the rest
                         rather than expanding Identity Service
                         past its documented boundary.

Community Dashboard   -> api.community_dashboard_view, served by
                         the Analytics Service (Phase 5 Step 10).

Analytics Dashboard   -> api.platform_statistics_view
                         (administrator-only), served by the
                         Analytics Service (Phase 5 Step 10).
```

This is a deliberate split, not an arbitrary one: Governance Domain (Step 5) owns platform *configuration*; Analytics Domain (Step 10) owns platform *statistics* and *community* rollups. "Admin Dashboard" surfaces configuration; "Analytics Dashboard" surfaces statistics -- they read different views because they answer different questions, not because of a naming coincidence.

Member Dashboard (`api.member_dashboard_view`) is not in scope -- `docs/phase-5-roadmap.md`'s Step 13 Deliverables name exactly four dashboards (Admin, Creator, Community, Analytics). Adding a Member Dashboard is a future roadmap step, not an omission to silently fix here.

---

# 4. Dashboard Data Flow

Every dashboard follows the same fixed pipeline. No dashboard may shorten, reorder, or bypass a stage:

```text
Page
       │
       ▼
Domain Service
       │
       ▼
API Schema
       │
       ▼
Business Schema
       │
       ▼
RLS
```

```text
Page:             A Server Component (Section 8) under
                   app/<dashboard>/page.tsx. Resolves the session
                   via config/supabase-server.ts, calls exactly one
                   Domain Service function, and renders the result
                   through shared components (Section 5). Never
                   queries any schema directly.

Domain Service:    The existing Phase 5 domain service function for
                   that dashboard (e.g. Governance Service's
                   getPlatformConfiguration(), Analytics Service's
                   listCommunityDashboards() / getPlatformStatistics()) --
                   a thin, typed wrapper translating an api.* read
                   into the domain's TypeScript shape. A dashboard
                   page reuses an existing Domain Service rather
                   than reimplementing its mapping logic.

API Schema:        The api.* view or function the Domain Service
                   calls (docs/api-schema.md), per "API Schema
                   First" -- never a business schema directly.

Business Schema:   The underlying identity/economy/discovery/
                   protection/intelligence/analytics/governance
                   table(s) the view or function reads from.

RLS:               The final authorization boundary, already
                   enforced on every business-schema table
                   (migrations 001-009). Every stage above is
                   advisory; RLS is what actually decides what
                   data returns to a given caller.
```

**Documented exception:** the Creator Dashboard's "Domain Service" stage is `app/creator/data.ts`, a page-local reader, not an existing domain service function -- because `api.creator_dashboard_view` is cross-domain with no single owner (Section 3). It occupies the same pipeline position (a thin, typed wrapper between the page and the api schema) and is bound by the same rule: it may only call the api schema, never a business schema directly.

---

# 5. Shared Component Architecture

`app/components/` is the only location for reusable, presentation-only UI components. Before creating a new component, an existing one must be checked and reused or extended -- per `CLAUDE.md`'s "No duplicated UI."

Approved components (Phase 5 Step 13 infrastructure, Founder-approved):

```text
DashboardShell  -- page title + content container (Section 1)
StatCard        -- single metric display; null renders as
                   "Not available", never 0 or blank (Section 8)
EmptyState      -- unauthorized/no-data message, shared across
                   every dashboard (Section 8)
```

Rules:

```text
Components in app/components/ are presentation-only: they accept
  data via props and render it. They never call a service, never
  query the api schema, and never import config/supabase-server.ts
  or config/supabase.ts. Data-fetching happens in the page (or a
  page-local reader like app/creator/data.ts), never inside a
  shared component.

A component is added to app/components/ only when at least two
  dashboards need it, or when a single dashboard's need is clearly
  going to recur (e.g. StatCard, needed by three of the four
  dashboards from the start). A one-off visual element used by
  exactly one page may stay inline in that page.
```

---

# 6. Design System

Tailwind utility classes only -- no separate component library, no CSS-in-JS, no custom design token system beyond Tailwind's own scale. This keeps the design system as small as the four dashboards currently need; it is expected to grow deliberately, not be front-loaded speculatively.

Conventions (established by the Step 13 infrastructure, ratified here):

```text
Color:      Neutral gray scale only (gray-200/300/500/900) for
            this phase's read-only, data-dense dashboards. No
            brand color palette is defined yet -- introducing one
            is a future design decision, not assumed here.

Surfaces:   rounded-lg border border-gray-200 for cards/sections;
            border-dashed border-gray-300 specifically for
            EmptyState, so an empty/unauthorized state is
            visually distinct from a populated card at a glance.

Spacing:    p-4 for compact cards (StatCard), p-5/p-6 for section
            containers, consistent gap-4 in grids.

Typography: text-sm for labels/body, text-lg/text-xl/text-2xl for
            section and page headings, font-medium/font-semibold
            for emphasis. No custom font is loaded -- the system
            font stack via Tailwind's defaults.
```

Any deviation from this palette/spacing scale in new dashboard work should be treated as a design system change, not a one-off page style.

---

# 7. Responsive Strategy

Mobile-first, using Tailwind's default breakpoints (`sm`, `md`, `lg`) directly on grid/layout utilities -- no separate mobile/desktop component variants.

```text
Base (no prefix):  single column, full-width cards -- correct
                    default for narrow viewports.
sm: (>=640px):     stat grids move to 2 columns
                    (grid-cols-2).
lg: (>=1024px):    stat grids move to 4 columns
                    (grid-cols-4).
```

Page containers use `mx-auto max-w-5xl px-6` (`DashboardShell`) so content stays readable on wide viewports without a separate desktop layout. No dashboard requires a distinct mobile-only or desktop-only view -- the same component tree reflows via Tailwind's responsive classes.

---

# 8. UI Composition Rules

```text
Server Components by default. A component becomes a Client
  Component ('use client') only when it needs browser-only
  behavior (state, effects, event handlers) -- none of the
  Step 13 dashboards need this yet, since they are read-only.

Data-fetching lives in pages (or page-local readers, e.g.
  app/creator/data.ts), never inside app/components/ (Section 5).

Every dashboard page resolves its own session via
  config/supabase-server.ts's getServerComponentAccessToken()
  before calling any service -- no component further down the
  tree re-resolves or re-checks the session.

RLS-restricted or otherwise-null data is always rendered through
  EmptyState (no session, non-admin viewing an admin-only view,
  RLS filtering a field to null) -- never patched over with a
  direct table query, a hardcoded fallback value, or a client-side
  retry loop. This is `docs/implementation-playbook.md`'s Frontend
  Rules requirement, restated here as a binding UI composition
  rule, not a suggestion.

No dashboard queries a business schema directly, and no dashboard
  or shared component ever imports config/supabase.ts's
  createSupabaseServiceClient(). Server Components are never
  bundled to the browser, but this rule holds regardless -- it is
  not relied upon as the only safeguard.
```

---

# 9. Directory Structure

Additions to `docs/application-architecture-freeze.md`'s "Approved Module Structure," ratified by this document once approved (that document is updated in the same pass, per the Architecture Change Lifecycle):

```text
backend/
├── app/
│   ├── (dashboards)/
│   │   └── layout.tsx       (Dashboard Layout, Section 1-2)
│   ├── admin/
│   │   └── page.tsx
│   ├── creator/
│   │   ├── page.tsx
│   │   └── data.ts          (page-local reader, Section 3)
│   ├── community/
│   │   └── page.tsx
│   ├── analytics/
│   │   └── page.tsx
│   ├── components/          (Section 5)
│   │   ├── DashboardShell.tsx
│   │   ├── StatCard.tsx
│   │   └── EmptyState.tsx
│   ├── config/
│   │   └── supabase-server.ts   (Step 13 infrastructure,
│   │                              already approved)
│   └── globals.css
```

No other directory is added by this document. `app/admin/`, `app/creator/`, `app/community/`, `app/analytics/`, and `app/components/` were created during Step 13 implementation ahead of this document; this section is what formally brings them into the approved structure, per the Founder's direction to govern them here before continuing.

---

# 10. Security Principles

Restated from `docs/authentication-architecture.md` for this domain specifically -- this document introduces no new security decision:

```text
service_role is never issued to, stored in, or reachable from
any file under app/admin/, app/creator/, app/community/,
app/analytics/, or app/components/

RLS remains the final authorization boundary; no dashboard or
component performs its own authorization decision beyond
rendering the EmptyState fallback for a null/empty result

Session resolution happens once per page (Section 8), server-
side, via config/supabase-server.ts -- never client-asserted
```

---

# Dependencies

```text
docs/authentication-architecture.md (session/RLS model, unchanged)
docs/backend-architecture.md ("Thin API Layer," Folder Structure)
docs/domain-architecture.md (dashboard ownership, Section 3)
docs/implementation-playbook.md (Frontend Rules)
docs/application-architecture-freeze.md (Approved Module
  Structure, extended by Section 9)
CLAUDE.md ("Frontend")
```

---

# Signup/Login Onboarding UI (EWP-011)

Extends this document per the charter's own "Documentation sync" field for EWP-011. Does not redefine anything in Sections 1-9 above; adds the first genuinely interactive surface this frontend has had.

```text
Route group: app/(auth)/ -- a minimal, chrome-free layout (no
  DashboardShell nav), per Section 1's own forward-reference to a
  future login page bypassing dashboard chrome. Contains
  (auth)/signup/page.tsx and (auth)/login/page.tsx, both Server
  Component wrappers rendering a Client Component form.

First Client Components in this codebase: app/components/
  SignupForm.tsx and LoginForm.tsx ('use client'). Every dashboard
  built under Phase 5 Step 13 is read-only and needed none, per
  Section 8's existing rule ("a component becomes a Client Component
  only when it needs browser-only behavior") -- these are the first
  to need it.

Browser Supabase client: app/config/supabase-browser.ts, using
  @supabase/ssr's createBrowserClient. This is what makes
  app/config/supabase-server.ts's existing getServerComponentAccessToken()
  functionally meaningful for the first time -- previously nothing
  ever wrote a session cookie for it to read.

Operations layer: app/services/auth/auth-service.ts (performSignup,
  performLogin, checkUsernameAvailability), following the existing
  services/<domain>/<domain>-service.ts convention (Section 5) --
  distinct from app/auth/'s server-side, Bearer-token Authentication
  Service, which this does not use or replace.

Redirect convention: both signup (only once a real session is
  returned) and login redirect to /community -- reuses an existing
  dashboard's already-correct RLS-driven empty-state handling rather
  than inventing a new destination. If signup succeeds but no
  session is returned (email confirmation required), a neutral
  "check your email" message is shown instead -- never treated as a
  logged-in state.

Username availability: advisory only (api.is_username_available(),
  012_add_username_availability_check.sql) -- debounced (~450ms) on
  change, with an immediate check on blur. Renders exactly one of
  idle / checking / available / taken; a network/RPC failure always
  resolves to idle, never "taken." The database's UNIQUE constraint
  remains the sole final authority.

Error mapping: app/services/auth/auth-service.ts's mapAuthError()
  prefers @supabase/supabase-js's structured AuthError.code, falling
  back to narrow substring matching only for
  identity.handle_new_auth_user()'s own custom exception text. Raw
  Postgres/GoTrue error text is never shown to the user.

Email-confirmation redirect: performSignup() accepts an optional
  emailRedirectTo parameter, passed through to client.auth.signUp()'s
  options.emailRedirectTo. Deliberately NOT computed inside
  auth-service.ts itself via window.location.origin -- that module is
  also called directly by tests/live/identity-provisioning.test.ts in
  a plain Node environment with no window global, so a hardcoded
  browser API there would break live tests. Instead, SignupForm.tsx
  (browser-only, 'use client') computes `${window.location.origin}/login`
  and passes it down; tests/live/ callers omit it, so Supabase falls
  back to its configured Site URL. This mechanism depends entirely on
  the target origin being present in the Supabase project's Auth
  Redirect URLs allowlist -- an origin not listed there will still
  fail even though the application code is correct, since Supabase
  Auth rejects unlisted redirect targets independently of what the
  application requests.
```

---

# Implementation Rules

```text
Never introduce a new top-level app/ directory beyond Section 9
without updating this document first

Never add a component to app/components/ that queries the
database or calls a service (Section 5)

Never hide a navigation link based on role without updating
Section 2 first

Never patch an RLS-null/empty state with a fallback value or a
direct table query (Section 8)

Never skip a stage of the Dashboard Data Flow (Section 4)
```

---

# Success Criteria

This architecture is ready for implementation when:

```text
Layout hierarchy is documented          -- done, above
Navigation strategy is documented       -- done, above
Dashboard ownership is documented       -- done, above
Dashboard data flow is documented       -- done, above
Shared component architecture is documented -- done, above
Design system is documented             -- done, above
Responsive strategy is documented       -- done, above
UI composition rules are documented     -- done, above
Reviewed and approved by Founder / Chief Architect -- done,
  2026-07-16
```

Dashboard page implementation (Phase 5 Step 13) resumes under this document.
