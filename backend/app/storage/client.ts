/**
 * Storage Service infrastructure connection (Infrastructure Service, per
 * docs/service-architecture.md). Phase 5 Step 2 deliverable: the
 * connection only -- no upload/media business logic.
 *
 * Uses Supabase Storage rather than a separate object-storage vendor:
 * Supabase is already the mandated platform (CLAUDE.md, "Backend"), and
 * docs/backend-architecture.md lists "Object storage" as a *future*
 * external integration -- choosing Supabase's own Storage now avoids
 * introducing a new third-party vendor decision that hasn't gone through
 * the Architecture Change Lifecycle.
 */

import { createSupabaseServiceClient } from '../config/supabase';

export function getStorageClient() {
  return createSupabaseServiceClient().storage;
}
