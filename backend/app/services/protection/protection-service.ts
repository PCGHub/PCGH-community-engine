/**
 * Protection Domain Service, per Phase 5 Step 8's deliverable: wraps
 * api.creator_protection_view only. Per the "API Schema First"
 * principle, this queries the api schema only -- never protection.*
 * directly.
 *
 * Deliberately does NOT wrap api.is_creator_on_cooldown(), even though
 * docs/domain-architecture.md lists it as a Protection Domain
 * dependency at the schema level. Cooldown status is not exposed to
 * creators (api.creator_protection_view itself omits it) and ADR-013
 * remains open -- adding a cooldown-status read here, even read-only,
 * would create an application-layer path around that open question.
 * Cooldown enforcement stays centralized inside
 * api.distribute_campaign() and is not re-checked here.
 *
 * api.creator_protection_view is `security_invoker = true` over
 * protection.community_exclusions, whose
 * community_exclusions_creator_select RLS policy (migration 004)
 * already scopes rows to `creator_id = identity.current_user_id()`.
 * This service adds no broader visibility of its own.
 */

import { createSupabaseClient } from '../../config/supabase';
import type { CreatorExclusion } from '../../domains/protection/protection';

interface CreatorExclusionRow {
  exclusion_id: string;
  creator_id: string;
  community_id: string;
  community_name: string | null;
  community_code: string | null;
  is_excluded: boolean;
  reason: string | null;
  expires_at: string | null;
}

const CREATOR_PROTECTION_COLUMNS =
  'exclusion_id, creator_id, community_id, community_name, community_code, is_excluded, reason, expires_at';

function toCreatorExclusion(row: CreatorExclusionRow): CreatorExclusion {
  return {
    exclusionId: row.exclusion_id,
    creatorId: row.creator_id,
    communityId: row.community_id,
    communityName: row.community_name,
    communityCode: row.community_code,
    isExcluded: row.is_excluded,
    reason: row.reason,
    expiresAt: row.expires_at,
  };
}

export async function listOwnExclusions(accessToken: string): Promise<CreatorExclusion[]> {
  const client = createSupabaseClient(accessToken);
  const { data, error } = await client
    .schema('api')
    .from('creator_protection_view')
    .select(CREATOR_PROTECTION_COLUMNS)
    .returns<CreatorExclusionRow[]>();

  if (error || !data) {
    return [];
  }

  return data.map(toCreatorExclusion);
}
