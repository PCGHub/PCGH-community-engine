/**
 * Creator Dashboard, per Phase 5 Step 13's deliverable: consumes the
 * full api.creator_dashboard_view via this page's own reader
 * (app/creator/data.ts) -- see that file for why this isn't routed
 * through an existing domain service.
 */

import { DashboardShell } from '../../components/DashboardShell';
import { EmptyState } from '../../components/EmptyState';
import { StatCard } from '../../components/StatCard';
import { getOwnCreatorDashboard } from './data';

export default async function CreatorDashboardPage() {
  const dashboard = await getOwnCreatorDashboard();

  if (!dashboard) {
    return (
      <DashboardShell title="Creator Dashboard">
        <EmptyState message="Sign in as a creator to view your dashboard." />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title={`Creator Dashboard — ${dashboard.username}`}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Wallet Balance" value={dashboard.walletBalance} />
        <StatCard label="Bonus Balance" value={dashboard.walletBonusBalance} />
        <StatCard label="Trust Score" value={dashboard.trustScore} />
        <StatCard label="Quality Score" value={dashboard.qualityScore} />
        <StatCard label="Consistency Score" value={dashboard.consistencyScore} />
        <StatCard label="Communities Reached" value={dashboard.communitiesReached} />
        <StatCard label="Members Reached" value={dashboard.membersReached} />
        <StatCard label="Views Generated" value={dashboard.viewsGenerated} />
        <StatCard label="Shares Generated" value={dashboard.sharesGenerated} />
        <StatCard label="Saves Generated" value={dashboard.savesGenerated} />
        <StatCard label="Amplification Score" value={dashboard.amplificationScore} />
        <StatCard label="Active Campaigns" value={dashboard.activeCampaignsCount} />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-medium text-gray-900">Earned Badges</h2>
        {dashboard.earnedBadges.length === 0 ? (
          <EmptyState message="No badges earned yet." />
        ) : (
          <ul className="flex flex-wrap gap-2">
            {dashboard.earnedBadges.map((badge) => (
              <li key={badge} className="rounded-full border border-gray-200 px-3 py-1 text-sm">
                {badge}
              </li>
            ))}
          </ul>
        )}
      </section>
    </DashboardShell>
  );
}
