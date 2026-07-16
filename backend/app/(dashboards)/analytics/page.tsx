/**
 * Analytics Dashboard, per Phase 5 Step 13's deliverable: consumes
 * api.platform_statistics_view (administrator-only) via the Analytics
 * Service built in Phase 5 Step 10 -- reused unchanged, not duplicated.
 */

import { DashboardShell } from '../../components/DashboardShell';
import { EmptyState } from '../../components/EmptyState';
import { StatCard } from '../../components/StatCard';
import { getServerComponentAccessToken } from '../../config/supabase-server';
import { getPlatformStatistics } from '../../services/analytics/analytics-service';

export default async function AnalyticsDashboardPage() {
  const accessToken = await getServerComponentAccessToken();

  if (!accessToken) {
    return (
      <DashboardShell title="Analytics Dashboard">
        <EmptyState message="Sign in to view platform analytics." />
      </DashboardShell>
    );
  }

  const stats = await getPlatformStatistics(accessToken);

  if (!stats) {
    return (
      <DashboardShell title="Analytics Dashboard">
        <EmptyState message="Platform statistics are administrator-only. Not available for this account." />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Analytics Dashboard">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={stats.totalUsers} />
        <StatCard label="Total Creators" value={stats.totalCreators} />
        <StatCard label="Total Communities" value={stats.totalCommunities} />
        <StatCard label="Total Campaigns" value={stats.totalCampaigns} />
        <StatCard label="Active Campaigns" value={stats.activeCampaigns} />
        <StatCard label="Credits Purchased" value={stats.totalCreditsPurchased} />
        <StatCard label="Credits Spent" value={stats.totalCreditsSpent} />
        <StatCard label="Discovery Opportunities" value={stats.totalDiscoveryOpportunities} />
        <StatCard label="Member Assignments" value={stats.totalMemberAssignments} />
        <StatCard label="Completed Assignments" value={stats.totalCompletedAssignments} />
        <StatCard label="Avg Member Reputation" value={stats.avgMemberReputation} />
        <StatCard label="Avg Creator Trust Score" value={stats.avgCreatorTrustScore} />
      </div>
    </DashboardShell>
  );
}
