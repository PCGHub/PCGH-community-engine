/**
 * Identity Domain Model: profile fields only, per
 * docs/domain-architecture.md's Identity Domain ("Uses:
 * api.creator_dashboard_view, api.member_dashboard_view (profile fields
 * only)"). No logic -- data shape only. See app/services/identity/ for
 * the service that reads these.
 */

export type UserStatus = 'active' | 'pending' | 'suspended' | 'deleted';

export interface UserProfile {
  readonly userId: string;
  readonly userCode: string;
  readonly username: string;
  readonly fullName: string | null;
  readonly avatarUrl: string | null;
  readonly status: UserStatus;
}
