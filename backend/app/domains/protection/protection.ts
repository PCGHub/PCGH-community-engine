/**
 * Protection Domain Model, per docs/domain-architecture.md's Protection
 * Domain: shape returned by api.creator_protection_view. No logic --
 * data shape only. See app/services/protection/ for the Protection
 * Domain Service.
 *
 * Deliberately excludes cooldown fields -- the view itself does not
 * expose them (pending ADR-013), and this model must not invent a
 * field the view doesn't provide.
 */

export interface CreatorExclusion {
  readonly exclusionId: string;
  readonly creatorId: string;
  readonly communityId: string;
  readonly communityName: string | null;
  readonly communityCode: string | null;
  readonly isExcluded: boolean;
  readonly reason: string | null;
  readonly expiresAt: string | null;
}
