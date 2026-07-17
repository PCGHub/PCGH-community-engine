/**
 * Campaign Application Service, per Phase 5 Step 6's deliverable:
 * wraps api.campaign_summary_view, api.distribute_campaign(),
 * api.rotate_campaign(), api.close_campaign(), api.archive_campaign(),
 * api.restore_campaign(), and api.calculate_campaign_performance().
 *
 * Per the "API Schema First" principle, this queries the api schema
 * only -- never economy.*, discovery.*, or protection.* directly.
 *
 * Cooldown enforcement is NOT reimplemented here. It is already
 * centralized inside api.distribute_campaign() (Migration 008 review),
 * which skips a community with a NOTICE when the creator is on
 * cooldown rather than raising. This service does not call
 * api.is_creator_on_cooldown() itself or add any equivalent check --
 * doing so would be exactly the "application-layer workaround or
 * duplicate check" Step 6's exit criteria forbids.
 *
 * Every mutating call below (distribute/rotate/close/archive/restore)
 * is a thin passthrough to a SECURITY DEFINER procedure that already
 * enforces its own admin-only authorization internally
 * (`identity.is_admin() or auth.uid() is null`) -- this service adds
 * no authorization decision of its own; RLS/the procedure's own check
 * remains authoritative.
 *
 * Observability (docs/technical-debt.md TD-003): every mutating call
 * records a structured log on failure and an audit event + metric on
 * success, using the existing app/utils/{logger,audit,metrics,tracing}
 * utilities exactly as designed -- no new logging framework, no change
 * to any function's parameters, return type, or error-throwing
 * contract.
 */

import { createSupabaseClient } from '../../config/supabase';
import type { CampaignPerformance, CampaignSummary } from '../../domains/campaign/campaign';
import { recordAuditEvent } from '../../utils/audit';
import { logger } from '../../utils/logger';
import { recordMetric } from '../../utils/metrics';
import { generateRequestId } from '../../utils/tracing';

interface CampaignSummaryRow {
  campaign_id: string;
  campaign_code: string;
  title: string;
  campaign_type: string;
  campaign_status: string;
  credits_budget: number;
  credits_spent: number;
  duration_hours: number;
  created_at: string;
  creator_id: string;
  creator_username: string;
  creator_full_name: string | null;
  communities_reached: number;
  avg_performance_score: number | null;
  total_members_viewed: number;
  total_members_shared: number;
  total_members_saved: number;
}

function toCampaignSummary(row: CampaignSummaryRow): CampaignSummary {
  return {
    campaignId: row.campaign_id,
    campaignCode: row.campaign_code,
    title: row.title,
    campaignType: row.campaign_type,
    campaignStatus: row.campaign_status,
    creditsBudget: row.credits_budget,
    creditsSpent: row.credits_spent,
    durationHours: row.duration_hours,
    createdAt: row.created_at,
    creatorId: row.creator_id,
    creatorUsername: row.creator_username,
    creatorFullName: row.creator_full_name,
    communitiesReached: row.communities_reached,
    avgPerformanceScore: row.avg_performance_score,
    totalMembersViewed: row.total_members_viewed,
    totalMembersShared: row.total_members_shared,
    totalMembersSaved: row.total_members_saved,
  };
}

const CAMPAIGN_SUMMARY_COLUMNS =
  'campaign_id, campaign_code, title, campaign_type, campaign_status, credits_budget, ' +
  'credits_spent, duration_hours, created_at, creator_id, creator_username, ' +
  'creator_full_name, communities_reached, avg_performance_score, total_members_viewed, ' +
  'total_members_shared, total_members_saved';

export async function getCampaignSummary(accessToken: string, campaignId: string): Promise<CampaignSummary | null> {
  const client = createSupabaseClient(accessToken);
  const { data, error } = await client
    .schema('api')
    .from('campaign_summary_view')
    .select(CAMPAIGN_SUMMARY_COLUMNS)
    .eq('campaign_id', campaignId)
    .maybeSingle<CampaignSummaryRow>();

  if (error || !data) {
    return null;
  }

  return toCampaignSummary(data);
}

export async function listCampaignSummaries(accessToken: string): Promise<CampaignSummary[]> {
  const client = createSupabaseClient(accessToken);
  const { data, error } = await client
    .schema('api')
    .from('campaign_summary_view')
    .select(CAMPAIGN_SUMMARY_COLUMNS)
    .returns<CampaignSummaryRow[]>();

  if (error || !data) {
    return [];
  }

  return data.map(toCampaignSummary);
}

interface CampaignPerformanceRow {
  members_assigned: number;
  members_viewed: number;
  members_shared: number;
  members_saved: number;
  avg_performance_score: number | null;
}

export async function getCampaignPerformance(
  accessToken: string,
  campaignId: string,
): Promise<CampaignPerformance | null> {
  const client = createSupabaseClient(accessToken);
  const { data, error } = await client
    .schema('api')
    .rpc('calculate_campaign_performance', { p_campaign_id: campaignId });

  if (error || !data) {
    return null;
  }

  const rows = data as CampaignPerformanceRow[];
  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    membersAssigned: row.members_assigned,
    membersViewed: row.members_viewed,
    membersShared: row.members_shared,
    membersSaved: row.members_saved,
    avgPerformanceScore: row.avg_performance_score,
  };
}

export async function distributeCampaign(
  accessToken: string,
  campaignId: string,
  communityIds: readonly string[],
): Promise<void> {
  const requestId = generateRequestId();
  const client = createSupabaseClient(accessToken);
  const { error } = await client
    .schema('api')
    .rpc('distribute_campaign', { p_campaign_id: campaignId, p_community_ids: communityIds });

  if (error) {
    logger.error('campaign.distribute.failed', { requestId, campaignId, communityIds, error: error.message });
    throw new Error(error.message);
  }

  recordAuditEvent({
    actorUserId: null,
    action: 'campaign.distribute',
    entityType: 'campaign',
    entityId: campaignId,
    metadata: { communityIds, requestId },
  });
  recordMetric('campaign.distributed', 1, { campaignId });
}

export interface RotateCampaignParams {
  readonly campaignId: string;
  readonly oldCommunityId: string;
  readonly newCommunityId: string;
  readonly createdBy: string;
  readonly cooldownDays?: number;
}

export async function rotateCampaign(accessToken: string, params: RotateCampaignParams): Promise<void> {
  const requestId = generateRequestId();
  const client = createSupabaseClient(accessToken);
  const { error } = await client.schema('api').rpc('rotate_campaign', {
    p_campaign_id: params.campaignId,
    p_old_community_id: params.oldCommunityId,
    p_new_community_id: params.newCommunityId,
    p_created_by: params.createdBy,
    p_cooldown_days: params.cooldownDays ?? null,
  });

  if (error) {
    logger.error('campaign.rotate.failed', { requestId, ...params, error: error.message });
    throw new Error(error.message);
  }

  recordAuditEvent({
    actorUserId: params.createdBy,
    action: 'campaign.rotate',
    entityType: 'campaign',
    entityId: params.campaignId,
    metadata: {
      oldCommunityId: params.oldCommunityId,
      newCommunityId: params.newCommunityId,
      cooldownDays: params.cooldownDays,
      requestId,
    },
  });
  recordMetric('campaign.rotated', 1, { campaignId: params.campaignId });
}

export async function closeCampaign(accessToken: string, campaignId: string): Promise<void> {
  const requestId = generateRequestId();
  const client = createSupabaseClient(accessToken);
  const { error } = await client.schema('api').rpc('close_campaign', { p_campaign_id: campaignId });

  if (error) {
    logger.error('campaign.close.failed', { requestId, campaignId, error: error.message });
    throw new Error(error.message);
  }

  recordAuditEvent({
    actorUserId: null,
    action: 'campaign.close',
    entityType: 'campaign',
    entityId: campaignId,
    metadata: { requestId },
  });
  recordMetric('campaign.closed', 1, { campaignId });
}

export async function archiveCampaign(accessToken: string, campaignId: string): Promise<void> {
  const requestId = generateRequestId();
  const client = createSupabaseClient(accessToken);
  const { error } = await client.schema('api').rpc('archive_campaign', { p_campaign_id: campaignId });

  if (error) {
    logger.error('campaign.archive.failed', { requestId, campaignId, error: error.message });
    throw new Error(error.message);
  }

  recordAuditEvent({
    actorUserId: null,
    action: 'campaign.archive',
    entityType: 'campaign',
    entityId: campaignId,
    metadata: { requestId },
  });
  recordMetric('campaign.archived', 1, { campaignId });
}

export async function restoreCampaign(accessToken: string, campaignId: string): Promise<void> {
  const requestId = generateRequestId();
  const client = createSupabaseClient(accessToken);
  const { error } = await client.schema('api').rpc('restore_campaign', { p_campaign_id: campaignId });

  if (error) {
    logger.error('campaign.restore.failed', { requestId, campaignId, error: error.message });
    throw new Error(error.message);
  }

  recordAuditEvent({
    actorUserId: null,
    action: 'campaign.restore',
    entityType: 'campaign',
    entityId: campaignId,
    metadata: { requestId },
  });
  recordMetric('campaign.restored', 1, { campaignId });
}
