# PCGH Community Engine

# Supabase

This directory contains the complete PostgreSQL implementation of the PCGH Community Engine.

## Structure

```
supabase/

migrations/

functions/

policies/

seeds/
```

---

## Migration Order

001 Identity

002 Economy

003 Discovery

004 Protection

005 Intelligence

006 Analytics

---

## Rules

Never modify existing migrations.

Always create a new migration.

Every migration must be production ready.

Every table must include:

- UUID Primary Key
- Foreign Keys
- Constraints
- Indexes
- Comments
- Row Level Security
- Policies

---

## Security

All tables use:

- Row Level Security
- Least Privilege Access
- Explicit Policies

No table should be publicly writable.

---

## Status

Ready for implementation.
