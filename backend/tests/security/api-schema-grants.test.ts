import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Static verification of 008_create_api_schema.sql's PUBLIC-EXECUTE
 * revocation (Phase 5 Step 14 deliverable: "Security tests confirming
 * ... PUBLIC execute remains revoked on every api schema function and
 * procedure, per the Migration 008 Security Review").
 *
 * This is a static/textual test, not a live database check -- no live
 * Supabase/Postgres connection is available in this environment. It
 * verifies the actual migration file still contains the REVOKE
 * statements this project's earlier security review added, and that
 * they precede the GRANTs to authenticated/service_role, so PUBLIC
 * (and therefore anon) never regains an EXECUTE path.
 *
 * This does NOT replace a live check. A genuine live-database
 * verification query is provided in
 * tests/security/live-verification-queries.sql for when a real
 * Supabase/Postgres connection is available (not executed here).
 */

const MIGRATION_PATH = join(__dirname, '../../../supabase/migrations/008_create_api_schema.sql');

function readMigration(): string {
  return readFileSync(MIGRATION_PATH, 'utf-8');
}

describe('api schema PUBLIC-execute revocation (static)', () => {
  it('revokes EXECUTE on all functions in schema api from public', () => {
    const sql = readMigration();
    expect(sql).toMatch(/revoke execute on all functions in schema api from public;/i);
  });

  it('revokes EXECUTE on all procedures in schema api from public', () => {
    const sql = readMigration();
    expect(sql).toMatch(/revoke execute on all procedures in schema api from public;/i);
  });

  it('the REVOKE statements appear before the GRANT to authenticated/service_role', () => {
    const sql = readMigration();

    const revokeFunctionsIndex = sql.search(/revoke execute on all functions in schema api from public;/i);
    const revokeProceduresIndex = sql.search(/revoke execute on all procedures in schema api from public;/i);
    const grantFunctionsIndex = sql.search(/grant execute on all functions in schema api to authenticated, service_role;/i);
    const grantProceduresIndex = sql.search(
      /grant execute on all procedures in schema api to authenticated, service_role;/i,
    );

    expect(revokeFunctionsIndex).toBeGreaterThan(-1);
    expect(revokeProceduresIndex).toBeGreaterThan(-1);
    expect(grantFunctionsIndex).toBeGreaterThan(-1);
    expect(grantProceduresIndex).toBeGreaterThan(-1);

    expect(revokeFunctionsIndex).toBeLessThan(grantFunctionsIndex);
    expect(revokeProceduresIndex).toBeLessThan(grantProceduresIndex);
  });
});
