-- Live database verification queries for Phase 5 Step 14's security
-- deliverable ("Security tests confirming RLS cannot be bypassed and
-- that PUBLIC execute remains revoked on every api schema function and
-- procedure"). Not executed by the automated test suite -- no live
-- Supabase/Postgres connection exists in this environment. Run these
-- manually against a live project once one is available.

-- 1. Confirm PUBLIC has no EXECUTE privilege on any api schema routine.
-- Expect: zero rows.
select p.proname, p.prokind
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'api'
  and has_function_privilege('public', p.oid, 'EXECUTE');

-- 2. Confirm authenticated and service_role DO have EXECUTE on every
-- api schema routine (the intended grant).
-- Expect: every api.* routine listed, for both roles.
select p.proname, r.rolname
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
cross join (values ('authenticated'), ('service_role')) as r(rolname)
where n.nspname = 'api'
  and has_function_privilege(r.rolname, p.oid, 'EXECUTE')
order by p.proname, r.rolname;

-- 3. Confirm RLS is enabled on every business-schema table (001-009).
-- Expect: relrowsecurity = true for every row.
select n.nspname as schema_name, c.relname as table_name, c.relrowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname in ('identity', 'economy', 'discovery', 'protection', 'intelligence', 'analytics', 'governance')
  and c.relkind = 'r'
order by n.nspname, c.relname;

-- 4. Spot-check: an anon-role session cannot read a business table
-- directly, even one exposed via an api.* view. Run as the anon role
-- (e.g. via `set role anon;` in a transaction you roll back) and
-- confirm this returns zero rows / a permission error, not data.
-- set role anon;
-- select * from identity.users limit 1;
-- reset role;
