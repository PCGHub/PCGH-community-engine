/**
 * Community Dashboard, per Phase 5 Step 13's deliverable: consumes
 * api.community_dashboard_view via the Analytics Service built in
 * Phase 5 Step 10 -- reused unchanged, not duplicated.
 *
 * historicalPerformance is rendered only when present -- for a
 * non-admin, non-owning caller it is legitimately null (RLS on
 * protection.community_performance_history), which this page renders
 * as an empty state rather than a workaround, per Step 13's exit
 * criteria.
 */

import { DashboardShell } from '../../components/DashboardShell';
import { EmptyState } from '../../components/EmptyState';
import { StatCard } from '../../components/StatCard';
import { getServerComponentAccessToken } from '../../config/supabase-server';
import { listCommunityDashboards } from '../../services/analytics/analytics-service';

export default async function CommunityDashboardPage() {
  const accessToken = await getServerComponentAccessToken();

  if (!accessToken) {
    return (
      <DashboardShell title="Community Dashboard">
        <EmptyState message="Sign in to view community dashboards." />
      </DashboardShell>
    );
  }

  const communities = await listCommunityDashboards(accessToken);

  if (communities.length === 0) {
    return (
      <DashboardShell title="Community Dashboard">
        <EmptyState message="No communities visible for this account." />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Community Dashboard">
      <div className="space-y-8">
        {communities.map((community) => (
          <section key={community.communityId} className="rounded-lg border border-gray-200 p-5">
            <h2 className="mb-4 text-lg font-medium text-gray-900">{community.name}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Members" value={community.memberCount} />
              <StatCard label="Reputation Score" value={community.reputationScore} />
              <StatCard label="Active Campaigns" value={community.activeCampaignsCount} />
              <StatCard label="Participation Rate" value={community.participationRate} />
              <StatCard label="Discoveries Viewed" value={community.discoveriesViewed} />
              <StatCard label="Discoveries Shared" value={community.discoveriesShared} />
              <StatCard label="Discoveries Saved" value={community.discoveriesSaved} />
            </div>

            {community.historicalPerformance === null ? (
              <div className="mt-4">
                <EmptyState message="Historical performance is not available for this account." />
              </div>
            ) : (
              <ul className="mt-4 space-y-1 text-sm text-gray-600">
                {community.historicalPerformance.map((record) => (
                  <li key={record.campaignId}>
                    {record.recordedAt}: performance {record.performanceScore ?? 'n/a'}, engagement{' '}
                    {record.engagementRate ?? 'n/a'}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </DashboardShell>
  );
}
