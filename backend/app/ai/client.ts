/**
 * AI Service integration contract (orchestration plumbing only), per
 * ADR-016: the AI Service is a separate, independently deployed
 * Python/FastAPI application. This file defines the shape of that
 * integration from the Next.js side -- it does not implement any AI
 * feature logic, and does not yet connect to a real deployment, since
 * the AI Service's own repository location has not been decided (see
 * app/ai/README.md).
 *
 * All AI features remain governed by governance.feature_flags /
 * governance.ai_controls and disabled by default (migration 009 seed
 * data) -- this client does not bypass that gating.
 */

import { getServerEnv } from '../config/env';

export interface AiServiceClient {
  readonly baseUrl: string | undefined;
  isConfigured(): boolean;
}

/**
 * Returns a handle describing whether the AI Service is configured.
 * Deliberately does not perform any request -- there is no endpoint
 * contract to call yet. Calling code must check isConfigured() and must
 * not assume AI orchestration is available.
 */
export function getAiServiceClient(): AiServiceClient {
  const { aiServiceUrl } = getServerEnv();
  return {
    baseUrl: aiServiceUrl,
    isConfigured: () => Boolean(aiServiceUrl),
  };
}
